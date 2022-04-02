#!/usr/bin/env node
// @ts-check
import 'reflect-metadata';
import 'dotenv/config';

import archiver from 'archiver';
import Axios from 'axios';
import { Command } from 'commander';
import copyfiles from 'copyfiles';
import { execa } from 'execa';
import FormData from 'form-data';
import glob from 'glob';
import HttpsProxyAgent from 'https-proxy-agent';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import ora from 'ora';

import { getAccessToken, login, logout } from './auth.mjs';
import { handleConvertedOutput, logger, prepareTsFile } from './utils.mjs';

const require = createRequire(import.meta.url);
const BASE_URL = process.env.BASE_URL || process.env.PLATFORM_URL;
const BUILD_DIR = process.env.BUILD_DIR || 'dist';

let axios;
if (process.env.https_proxy || process.env.http_proxy) {
  const httpsAgent = HttpsProxyAgent(process.env.https_proxy || process.env.http_proxy);
  axios = Axios.create({ httpsAgent, proxy: false });
} else {
  axios = Axios;
}

let apiToken;
let projectsRoot = 'modules';

const CMD = {
  AUDIT: 'audit',
  BUILD: 'build',
  FORMAT: 'format',
  INSTALL: 'install',
  LINT: 'lint',
  RUN: 'run',
  TEST: 'test',
  WATCH: 'watch',
};

const program = new Command();

program
  .version('2.13.0', '-v, --version')
  .usage('[command] [options]')
  .description('Flow Module Management Tool')
  .on('--help', () => {});

program
  .command('build [projectName]')
  .description('Builds specified project')
  .action(async (projectName) => {
    try {
      if (checkIfAll(projectName)) process.exit(1);
      const project = await findProject(projectName);
      await exec(CMD.INSTALL, project);
      await exec(CMD.BUILD, project);
      await copyProjectFiles(project);
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

program
  .command('install [projectName]')
  .description('Installs the dependencies of the specified project')
  .action(async (projectName) => {
    try {
      if (projectName === 'all') {
        const projects = await findProjects();
        for (const project of projects) {
          await exec(CMD.INSTALL, project);
        }
      } else {
        const project = await findProject(projectName);
        await exec(CMD.INSTALL, project);
      }
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

program
  .command('audit [projectName]')
  .description('Audit dependencies')
  .action(async (projectName) => {
    try {
      if (projectName === 'all') {
        const projects = await findProjects();
        for (const project of projects) {
          await exec(CMD.AUDIT, project);
        }
      } else {
        const project = await findProject(projectName);
        await exec(CMD.AUDIT, project);
      }
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

program
  .command('lint [projectName]')
  .description('Lint project files')
  .action(async (projectName) => {
    try {
      let project;
      if (projectName === 'all') {
        project = { location: '.' };
      }
      project = await findProject(projectName);
      await exec(CMD.LINT, project);
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

program
  .command('login')
  .option('--url <url>', 'URL of target platform')
  .option('-r, --realm <realm>', 'Auth realm of target platform')
  .description('Authenticate against platform')
  .action(async (options) => {
    try {
      await login(options.url, options.realm);
      process.exit(0);
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

program
  .command('logout')
  .option('--url <url>', 'URL of target platform')
  .description('Authenticate')
  .action(async (options) => {
    try {
      await logout(options.url);
      process.exit(0);
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

program
  .command('format')
  .description('Formats all typescript files according to prettier configuration')
  .action(async () => {
    try {
      await exec(CMD.FORMAT, { name: 'all' });
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

program
  .command('package [projectName]')
  .description('Builds specified Module and packages it as .zip File for manual upload to the platform')
  .action(async (projectName) => {
    try {
      if (checkIfAll(projectName)) process.exit(1);
      const project = await findProject(projectName);
      await clean(BUILD_DIR);
      await exec(CMD.INSTALL, project);
      await exec(CMD.BUILD, project);
      await copyProjectFiles(project);
      await validateModule(project);
      await packageModule(project);
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

program
  .command('publish-module [projectName]')
  .option('--url <url>', 'URL of target platform')
  .option('-r, --realm <realm>', 'Auth realm of target platform')
  .option('-f, --functions', 'publish flow functions')
  .option('-u, --update', 'update existing flow functions')
  .option('-s, --skip', 'skip modules that already exists with the current version')
  .description('Publishes specified Module to Cloud Platform')
  .action(async (projectName, options) => {
    try {
      const projects = [];
      if (projectName === 'all') {
        for (const project of await findProjects()) {
          projects.push(project);
        }
      } else {
        projects.push(await findProject(projectName));
      }

      apiToken = await getAccessToken(options.url, options.realm);
      logger.ok('Got Access Token');
      for (const project of projects) {
        await clean(BUILD_DIR);
        await exec(CMD.INSTALL, project);
        await exec(CMD.BUILD, project);
        await copyProjectFiles(project);
        await validateModule(project);
        try {
          await publishModule(project, options.url);
        } catch (error) {
          if (
            options.skip &&
            error &&
            error.response &&
            error.response.data &&
            error.response.data.message === 'New module version must greater than latest version'
          ) {
            logger.ok(`Module "${project.name}" is up to date. Skipping.`);
          } else {
            logger.error(`Publishing Module "${project.name}" failed.`);
            handleApiError(error);
            process.exit(1);
          }
        }
        if (options.functions) {
          await publishFunctions(project, options.update, options.url);
        }
      }
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

program
  .command('publish-functions [projectName]')
  .option('--url <url>', 'URL of target platform')
  .option('-r, --realm <realm>', 'Auth realm of target platform')
  .option('-u, --update', 'update existing flow functions')
  .description('Publishes all Flow Functions inside specified Module to Cloud Platform')
  .action(async (projectName, options) => {
    try {
      const projects = [];
      if (projectName === 'all') {
        for (const project of await findProjects()) {
          projects.push(project);
        }
      } else {
        projects.push(await findProject(projectName));
      }

      apiToken = await getAccessToken(options.url, options.realm);
      logger.ok('Got Access Token');
      for (const project of projects) {
        await publishFunctions(project, options.update, options.url);
      }
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

program
  .command('serve [projectName]')
  .description('Builds and serves your project. Rebuilding on file changes')
  .action(async (projectName) => {
    try {
      if (checkIfAll(projectName)) process.exit(1);
      const project = await findProject(projectName);
      await exec(CMD.INSTALL, project);
      await exec(CMD.BUILD, project);
      await copyProjectFiles(project);
      await exec(CMD.WATCH, project);
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

program
  .command('start [projectName]')
  .description('Runs your project')
  .action(async (projectName) => {
    try {
      if (checkIfAll(projectName)) process.exit(1);
      const project = await findProject(projectName);
      await exec(CMD.RUN, project);
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

program
  .command('test [projectName]')
  .description('Runs tests for your project')
  .action(async (projectName) => {
    try {
      // check if it is running in Gitlab CI
      if (process.env.CI && projectName === 'all') {
        const projects = await findProjects();
        for (const project1 of projects.filter((project) => !project['excludeTestsInCI'])) {
          // only run tests that can be run in CI
          await exec(CMD.TEST, project1);
        }
      } else {
        const project = await findProject(projectName);
        await exec(CMD.TEST, project);
      }
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

program
  .command('generate-schemas [projectName]')
  .description('Generates Input, Output and Properties-Schemas for the project')
  .option('-h, --hide', 'hide warnings')
  .option('-v, --verbose', 'get more output info')
  .action(async (projectName) => {
    try {
      const project = await findProject(projectName);
      const globOptions = {
        cwd: project.location,
        ignore: ['node_modules/**/*', '**/package*.json', '**/tsconfig*.json'],
      };
      glob('**/*.*', globOptions, async (error, files) => {
        const filtered = files.filter((file) => !file.endsWith('.spec.ts'));
        const tsJsonMap = filtered.reduce((accumulator, current, index, array) => {
          if (current.endsWith('.ts')) {
            // get json file for current function
            const json = array.find((v) => v === `${current.split('.')[0]}.json`);
            if (json) {
              accumulator.push({
                ts: path.join(globOptions.cwd, current),
                json: path.join(globOptions.cwd, json),
              });
            }
          }
          return accumulator;
        }, []);
        for (let entry of tsJsonMap) {
          await generateSchemasForFile(entry.ts, entry.json);
        }
      });
    } catch (error) {
      if (error) logger.log(error);
      process.exit(1);
    }
  });

if (process.env.NODE_ENV !== 'test') {
  program.parse(process.argv);
}

async function generateSchemasForFile(tsPath, jsonPath) {
  // get schema
  const fileContent = await fs.promises.readFile(path.join(process.cwd(), jsonPath));
  let json = JSON.parse(fileContent.toString());

  const filePath = path.join(process.cwd(), tsPath);
  const tsFile = await fs.promises.readFile(filePath);
  const directory = path.dirname(filePath);

  const result = await execa('ts-node', ['-T', '--dir', directory], { input: prepareTsFile(tsFile.toString()), preferLocal: true });
  json = await handleConvertedOutput(result.stdout, jsonPath, json);
  await fs.promises.writeFile(path.join(process.cwd(), jsonPath), JSON.stringify(json, null, 2) + '\n');
}

async function clean(buildFolder) {
  return new Promise((resolve, reject) => {
    const spinner = getSpinner('Cleaning').start();
    fs.rm(buildFolder, { recursive: true, force: true }, (error) => {
      if (error) {
        spinner.stop();
        logger.error('Cleaning failed');
        logger.error(error);
        return reject(error);
      } else {
        spinner.stop();
        logger.ok('Cleaning successful');
        return resolve();
      }
    });
  });
}

function exec(cmd, project) {
  return new Promise((resolve, reject) => {
    if (!project) {
      return reject();
    }

    const options = { ...getProcessOptions(cmd, project), env: process.env };
    if (cmd === CMD.RUN || cmd === CMD.WATCH) {
      logger.ok(`\n${getLabel(cmd)} ${project.name}:\n`);
      execa(getProcess(cmd), getProcessArguments(cmd, project), options).stdout.pipe(process.stdout);
    } else {
      const spinner = getSpinner(`${getLabel(cmd)} ${project.name}`);
      spinner.start();
      execa(getProcess(cmd), getProcessArguments(cmd, project), options)
        .then((result) => {
          spinner.stop();
          logger.log(result.stdout);
          logger.ok(`${getLabel(cmd)} Succeeded`);
          return resolve();
        })
        .catch((error) => {
          spinner.stop();
          if (error.stderr) logger.error(error.stderr);
          else logger.error(error);
          if (error.stdout) logger.log(error.stdout);
          logger.error(`${getLabel(cmd)} Failed`);
          return reject();
        });
    }
  });
}

function isDirectory(p) {
  return new Promise((resolve) => {
    fs.lstat(p, (error, stats) => {
      if (!error && stats) {
        resolve(stats.isDirectory());
      } else {
        resolve(false);
      }
    });
  });
}

async function findProjects() {
  const isProject = (directory) =>
    new Promise((resolve) => {
      fs.access(path.join(directory, 'package.json'), (error) => {
        if (!error) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });

  const rootPackage = await readJson(path.join(process.cwd(), 'package.json'));

  const projects = [];
  const files = await fs.promises.readdir(projectsRoot);
  if (files) {
    for (const file of files) {
      if (file && (await isDirectory(path.join(projectsRoot, file)))) {
        const projectPath = path.join(projectsRoot, file, 'package.json');
        if (await isProject(path.join(projectsRoot, file))) {
          try {
            const package_ = await readJson(path.join(path.dirname(projectPath), 'package.json'));
            package_.location = path.posix.join(projectsRoot, file);
            package_.dist = path.posix.join(process.cwd(), BUILD_DIR, file);
            if (rootPackage) {
              package_.dependencies = { ...package_.dependencies, ...rootPackage.dependencies };
              package_.repository = rootPackage.repository;
            }
            projects.push(package_);
          } catch (error) {
            if (error) logger.log(error);
          }
        }
      }
    }
  }

  return projects;
}

function findProject(projectName) {
  return new Promise(async (resolve, reject) => {
    if (!projectName) {
      logger.error('No project specified');
      return reject();
    }
    if (projectName === 'all') {
      const project = {
        name: 'all',
        version: '0.0.0',
        location: '.',
      };
      return resolve(project);
    }

    const projects = await findProjects();
    for (const project of projects) {
      const location = path.parse(project.location);
      const directoryName = location.name + location.ext;
      if (project.name === projectName || directoryName === projectName) {
        return resolve(project);
      }
    }

    logger.error(`Cloud not find ${projectName} Module.`);
    reject();
  });
}

async function packageModule(project) {
  const { dist, ...package_ } = project;
  const file = path.posix.join(dist, '..', `${project.name}.zip`);
  await writeJson(path.join(dist, 'package.json'), package_);
  await zipDirectory(dist, file);
  return file;
}

async function publishModule(project, baseUrl = BASE_URL) {
  return new Promise(async (resolve, reject) => {
    const file = await packageModule(project);

    const form = new FormData();
    form.append('file', fs.createReadStream(file));
    form.append('name', project.name);
    form.append('description', project.description || '');
    form.append('version', project.version || '');

    try {
      await axios.post(`${baseUrl}/api/flow/modules`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${apiToken}`,
        },
      });

      logger.ok(`Module "${project.name}" published!`);
      return resolve();
    } catch (error) {
      return reject(error);
    } finally {
      deleteFile(file);
    }
  });
}

async function validateModule(project) {
  const module = require(project.dist);
  const moduleName = Reflect.getMetadata('module:name', module.default);
  const moduleDeclarations = Reflect.getMetadata('module:declarations', module.default);

  const functionFqns = [];
  for (const declaration of moduleDeclarations) {
    const fqn = Reflect.getMetadata('element:functionFqn', declaration);
    if (!fqn) {
      throw new Error(`FlowFunction (${declaration.name}) metadata is missing or invalid.`);
    }
    functionFqns.push(fqn);
  }

  if (moduleName) {
    project.name = moduleName;
    project.functions = functionFqns;
  } else {
    throw new Error('Could not validate module name');
  }
}

async function publishFunctions(project, update, baseUrl = BASE_URL) {
  return new Promise(async (resolve, reject) => {
    const globOptions = {
      cwd: project.location,
      ignore: ['node_modules/**/*', '**/package*.json', '**/tsconfig*.json'],
    };
    glob('**/*.json', globOptions, async (error, files) => {
      if (error) {
        return reject(error);
      }
      const headers = { Authorization: `Bearer ${apiToken}` };

      for (const file of files) {
        try {
          const data = await fs.promises.readFile(path.join(globOptions.cwd, file));
          const json = JSON.parse(data.toString());
          if (json.fqn && json.category) {
            if (update) {
              try {
                await axios.put(`${baseUrl}/api/flow/functions/${json.fqn}`, json, { headers });
                logger.ok(`Flow Function "${json.fqn}" has been updated`);
              } catch (error) {
                logger.error(`Flow Function "${json.fqn}" could not be updated`);
                handleApiError(error);
              }
            } else {
              try {
                await axios.post(`${baseUrl}/api/flow/functions`, json, { headers });
                logger.ok(`Flow Function "${json.fqn}" has been created`);
              } catch (error) {
                logger.error(`Flow Function "${json.fqn}" could not be created`);
                handleApiError(error);
              }
            }
          }
        } catch (error) {
          logger.error(error);
        }
      }
      return resolve();
    });
  });
}

function handleApiError(error) {
  if (error.isAxiosError && error.response) {
    logger.error(`${error.response.status} ${error.response.statusText}`);
    if (error.response.data) {
      logger.error(JSON.stringify(error.response.data));
    }
  } else {
    logger.error(error);
  }
}

function zipDirectory(source, out) {
  const archive = archiver('zip', { zlib: { level: 8 } });
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', (error) => reject(error))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
}

function deleteFile(path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (error) => {
      if (error) return reject(error);
      return resolve();
    });
  });
}

function getProcess(cmd) {
  switch (cmd) {
    case CMD.BUILD:
      return 'tsc';
    case CMD.FORMAT:
      return 'prettier';
    case CMD.INSTALL:
    case CMD.AUDIT:
      return 'npm';
    case CMD.LINT:
      return 'eslint';
    case CMD.RUN:
      return 'node';
    case CMD.TEST:
      return 'jest';
    case CMD.WATCH:
      return 'nodemon';
    default:
      return '';
  }
}

function copyProjectFiles(project) {
  return new Promise((resolve, reject) => {
    copyfiles(
      [`${project.location}/**`, `${BUILD_DIR}/`],
      {
        exclude: [`${project.location}/*.json`, `${project.location}/**/*.ts`, `${project.location}/**/test/**`],
        up: 1,
      },
      (error) => {
        if (error) {
          return reject(error);
        }
        return resolve();
      },
    );
  });
}

function getProcessArguments(cmd, project) {
  switch (cmd) {
    case CMD.AUDIT:
      return ['audit', '--audit-level=moderate'];
    case CMD.BUILD: {
      const filename = path.join(project.location, 'tsconfig.module.json');
      const configFile = fs.existsSync(filename) ? filename : project.location;
      return ['-p', configFile];
    }
    case CMD.FORMAT:
      return ['--write', '**/*.ts'];
    case CMD.INSTALL:
      return ['install', '--no-package-lock'];
    case CMD.LINT:
      return [project.location + '/**/*.{js,ts}', '--fix'];
    case CMD.RUN:
      return [project.location];
    case CMD.TEST:
      return project.name === 'all'
        ? ['--runInBand', '--coverage', '--forceExit', '--verbose', '--passWithNoTests']
        : ['roots', project.location, '--forceExit', '--verbose', '--passWithNoTests'];
    case CMD.WATCH:
      return ['--inspect', project.location];
    default:
      return [];
  }
}

function getProcessOptions(cmd, project) {
  switch (cmd) {
    case CMD.INSTALL:
      return { cwd: project.location };
  }
}

function getLabel(cmd) {
  switch (cmd) {
    case CMD.RUN:
      return 'Running';
    default:
      return `${cmd.charAt(0).toUpperCase()}${cmd.slice(1)}ing`;
  }
}

function getSpinner(message) {
  return ora({
    color: 'magenta',
    spinner: 'dots',
    text: message,
  });
}

function checkIfAll(projectName) {
  if (projectName === 'all') {
    logger.error(`Please specify a project. Command can't be run for all.`);
    return true;
  }
  return false;
}

function readJson(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf8' }, (error, data) => {
      if (error) return reject(error);
      try {
        return resolve(JSON.parse(data));
      } catch (error) {
        return reject(error);
      }
    });
  });
}

function writeJson(path, data) {
  return new Promise((resolve, reject) => {
    let dataString;
    try {
      dataString = JSON.stringify(data, null, 2) + '\n';
    } catch (error) {
      return reject(error);
    }
    fs.writeFile(path, dataString, (error) => {
      if (error) return reject(error);
      return resolve();
    });
  });
}
