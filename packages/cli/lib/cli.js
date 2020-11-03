#!/usr/bin/env node
require('reflect-metadata');

const archiver = require('archiver');
const chalk = require('chalk');
const { Command } = require('commander');
const execa = require('execa');
const FormData = require('form-data');
const fs = require('fs');
const glob = require('glob');
const got = require('got');
const ora = require('ora');
const path = require('path');
const readPkg = require('read-pkg');
const rimraf = require('rimraf');
const writePkg = require('write-pkg');

require('dotenv').config();

const log = console.log;
const ok = chalk.bold.green;
const error = chalk.bold.red;

const apiUser = process.env.API_USER;
const apiKey = process.env.API_KEY;
const baseUrl = process.env.PLATFORM_URL;
const buildDir = process.env.BUILD_DIR || 'dist';
const realm = process.env.REALM;
const authUrl = process.env.AUTH_URL || `${baseUrl}/auth/realms/${realm}/protocol/openid-connect/token`;

let apiToken;
let projectsRoot = 'modules';

const CMD = {
  BUILD: 'build',
  COPY: 'copy',
  FORMAT: 'format',
  INSTALL: 'install',
  LINT: 'lint',
  PUBLISH: 'publish',
  RUN: 'run',
  TEST: 'test',
  WATCH: 'watch',
};

const program = new Command();

program
  .version('2.2.0', '-v, --version')
  .usage('[command] [options]')
  .description('Flow Module Management Tool.')
  .on('--help', () => {});

program
  .command('build [projectName]')
  .description('Builds specified Project.')
  .action(async (projectName) => {
    try {
      if (checkIfAll(projectName)) process.exit(1);
      const project = await findProject(projectName);
      await exec(CMD.INSTALL, project);
      await exec(CMD.BUILD, project);
      await exec(CMD.LINT, project);
      await exec(CMD.COPY, project);
    } catch (err) {
      if (err) log(err);
      process.exit(1);
    }
  });

program
  .command('install [projectName]')
  .description('Installs the dependencies of the specified Project.')
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
    } catch (err) {
      if (err) log(err);
      process.exit(1);
    }
  });

program
  .command('format')
  .description('Formats all typescript files according to prettier configuration.')
  .action(async () => {
    try {
      await exec(CMD.FORMAT, { name: 'all' });
    } catch (err) {
      if (err) log(err);
      process.exit(1);
    }
  });

program.command('name [projectName]').action(async (projectName) => {
  try {
    if (checkIfAll(projectName)) process.exit(1);
    const project = await findProject(projectName);
    await clean(buildDir);
    await exec(CMD.INSTALL, project);
    await exec(CMD.BUILD, project);
  } catch (err) {
    if (err) log(err);
    process.exit(1);
  }
});

program
  .command('package [projectName]')
  .description('Builds specified Module and packages it as .zip File for manual upload to the platform.')
  .action(async (projectName) => {
    try {
      if (checkIfAll(projectName)) process.exit(1);
      const project = await findProject(projectName);
      await clean(buildDir);
      await exec(CMD.INSTALL, project);
      await exec(CMD.BUILD, project);
      await exec(CMD.LINT, project);
      await exec(CMD.COPY, project);
      await validateModule(project);
      await packageModule(project);
    } catch (err) {
      if (err) log(err);
      process.exit(1);
    }
  });

program
  .command('publish-module [projectName]')
  .option('-f, --functions', 'publish flow functions')
  .option('-u, --update', 'update existing flow functions')
  .description('Publishes specified Module to Cloud Platform.')
  .action(async (projectName, cmdObj) => {
    try {
      if (checkEnvModules()) process.exit(1);
      const projects = [];
      if (projectName === 'all') {
        for (const project of await findProjects()) {
          projects.push(project);
        }
      } else {
        projects.push(await findProject(projectName));
      }

      await getAccessToken();
      for (const project of projects) {
        await clean(buildDir);
        await exec(CMD.INSTALL, project);
        await exec(CMD.BUILD, project);
        await exec(CMD.LINT, project);
        await exec(CMD.COPY, project);
        await validateModule(project);
        await publishModule(project);
        if (cmdObj.functions) {
          await publishFunctions(project, cmdObj.update);
        }
      }
    } catch (err) {
      if (err) log(err);
      process.exit(1);
    }
  });

program
  .command('publish-functions [projectName]')
  .option('-u, --update', 'update existing flow functions')
  .description('Publishes all Flow Functions inside specified Module to Cloud Platform.')
  .action(async (projectName, cmdObj) => {
    try {
      if (checkEnvModules()) process.exit(1);
      const projects = [];
      if (projectName === 'all') {
        for (const project of await findProjects()) {
          projects.push(project);
        }
      } else {
        projects.push(await findProject(projectName));
      }

      await getAccessToken();
      for (const project of projects) {
        await publishFunctions(project, cmdObj.update);
      }
    } catch (err) {
      if (err) log(err);
      process.exit(1);
    }
  });

program
  .command('serve [projectName]')
  .description('Builds and serves your Project. Rebuilding on file changes.')
  .action(async (projectName) => {
    try {
      if (checkIfAll(projectName)) process.exit(1);
      const project = await findProject(projectName);
      await exec(CMD.INSTALL, project);
      await exec(CMD.BUILD, project);
      await exec(CMD.COPY, project);
      await exec(CMD.WATCH, project);
    } catch (err) {
      if (err) log(err);
      process.exit(1);
    }
  });

program
  .command('start [projectName]')
  .description('Runs your project.')
  .action(async (projectName) => {
    try {
      if (checkIfAll(projectName)) process.exit(1);
      const project = await findProject(projectName);
      await exec(CMD.RUN, project);
    } catch (err) {
      if (err) log(err);
      process.exit(1);
    }
  });

program
  .command('test [projectName]')
  .description('Runs tests for your Project.')
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
    } catch (err) {
      if (err) log(err);
      process.exit(1);
    }
  });

program.parse(process.argv);

async function clean(buildFolder) {
  return new Promise((resolve, reject) => {
    const spinner = getSpinner('Cleaning').start();
    rimraf(buildFolder, (err) => {
      if (err) {
        spinner.stop();
        log(error('Cleaning failed'));
        log(error(err));
        return reject(err);
      } else {
        spinner.stop();
        log(ok('Cleaning successful'));
        return resolve();
      }
    });
  });
}

function exec(cmd, project) {
  return new Promise((resolve, reject) => {
    if (!project) {
      log(`${chalk.red('Wrong command options.')} Type "hpc ${cmd} --help" to see how to use this command.`);
      return reject();
    }
    if (cmd === CMD.RUN || cmd === CMD.WATCH) {
      log(ok(`\n${getLabel(cmd)} ${project.name}:\n`));
      execa(getProcess(cmd), getProcessArguments(cmd, project), getProcessOptions(cmd, project)).stdout.pipe(process.stdout);
    } else {
      const spinner = getSpinner(`${getLabel(cmd)} ${project.name}`);
      spinner.start();
      execa(getProcess(cmd), getProcessArguments(cmd, project), getProcessOptions(cmd, project))
        .then((result) => {
          spinner.stop();
          log(result.stdout);
          log(ok(`${getLabel(cmd)} Succeeded`));
          return resolve();
        })
        .catch((err) => {
          spinner.stop();
          if (err.stderr) log(error(err.stderr));
          else log(error(err));
          if (err.stdout) log(err.stdout);
          log(error(`${getLabel(cmd)} Failed`));
          return reject();
        });
    }
  });
}

function isDir(p) {
  return new Promise((res, rej) => {
    fs.lstat(p, (err, stats) => {
      if (!err && stats) {
        res(stats.isDirectory());
      } else {
        res(false);
      }
    });
  });
}

async function findProjects() {
  const readDir = (dir) =>
    new Promise((res, rej) => {
      fs.readdir(dir, (err, files) => {
        if (!err && files) {
          res(files);
        } else {
          res([]);
        }
      });
    });
  const isProject = (dir) =>
    new Promise((res, rej) => {
      fs.access(path.join(dir, 'package.json'), (err) => {
        if (!err) {
          res(true);
        } else {
          res(false);
        }
      });
    });

  const rootPkg = await readPkg({ normalize: false });

  const projects = [];
  const files = await readDir(projectsRoot);
  if (files) {
    for (const file of files) {
      if (file && (await isDir(path.join(projectsRoot, file)))) {
        const projectPath = path.join(projectsRoot, file, 'package.json');
        if (await isProject(path.join(projectsRoot, file))) {
          try {
            const pkg = await readPkg({ cwd: path.dirname(projectPath), normalize: false });
            pkg.location = path.posix.join(projectsRoot, file);
            pkg.dist = path.posix.join(process.cwd(), buildDir, file);
            if (rootPkg) {
              pkg.dependencies = { ...pkg.dependencies, ...rootPkg.dependencies };
              pkg.repository = rootPkg.repository || {};
            }
            projects.push(pkg);
          } catch (err) {
            if (err) log(err);
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
      log(error('No Project specified.'));
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
      const dirName = location.name + location.ext;
      if (project.name === projectName || dirName === projectName) {
        return resolve(project);
      }
    }

    log(error(`Cloud not find ${projectName} Module.`));
    reject();
  });
}

async function getAccessToken() {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await got
        .post(authUrl, {
          headers: {
            'Content-type': 'application/x-www-form-urlencoded',
          },
          form: {
            client_id: apiUser,
            client_secret: apiKey,
            grant_type: 'client_credentials',
          },
        })
        .json();

      if (!response || !response.access_token) {
        throw new Error();
      }
      apiToken = response.access_token;
      log(ok('AccessToken acquired'));
      return resolve();
    } catch (err) {
      log(error('Could not get AccessToken'));
      return reject(err);
    }
  });
}

async function packageModule(project) {
  const { location, dist, ...package } = project;
  const file = path.posix.join(dist, '..', `${project.name}.zip`);
  await writePkg(dist, package);
  await zipDirectory(dist, file);
  return file;
}

async function publishModule(project) {
  return new Promise(async (resolve, reject) => {
    const file = await packageModule(project);

    const form = new FormData();
    form.append('file', fs.createReadStream(file));
    form.append('name', project.name);
    form.append('description', project.description || '');
    form.append('version', project.version || '');

    try {
      await got.post(`${baseUrl}/api/flow/modules`, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${apiToken}`,
        },
        body: form,
      });

      log(ok('Module published!'));
      return resolve();
    } catch (err) {
      log(error('Publishing Module failed.'));
      handleApiError(err);
      return reject(err);
    } finally {
      deleteFile(file);
    }
  });
}

async function validateModule(project) {
  const module = require(project.dist);
  const moduleName = Reflect.getMetadata('module:name', module.default);
  const moduleDeclarations = Reflect.getMetadata('module:declarations', module.default);

  const funcFqns = [];
  for (const declaration of moduleDeclarations) {
    const fqn = Reflect.getMetadata('element:functionFqn', declaration);
    if (!fqn) {
      throw new Error(`FlowFunction (${declaration.name}) metadata is missing or invalid.`);
    }
    funcFqns.push(fqn);
  }

  if (moduleName) {
    project.name = moduleName;
    project.functions = funcFqns;
  } else {
    throw new Error('Could not validate module name');
  }
}

async function publishFunctions(project, update) {
  return new Promise(async (resolve, reject) => {
    const globOptions = {
      cwd: project.location,
      ignore: ['node_modules/**/*', '**/package*.json', '**/tsconfig*.json'],
    };
    glob('**/*.json', globOptions, async (err, files) => {
      if (err) {
        return reject(err);
      }
      const headers = { Authorization: `Bearer ${apiToken}` };

      for (const file of files) {
        try {
          const data = await fs.promises.readFile(path.join(globOptions.cwd, file));
          const json = JSON.parse(data);
          if (json.fqn && json.category) {
            if (update) {
              try {
                await got.put(`${baseUrl}/api/flow/functions/${json.fqn}`, { headers, json });
                log(ok(`Flow Function "${json.fqn}" has been updated`));
              } catch (err) {
                log(error(`Flow Function "${json.fqn}" could not be updated`));
                handleApiError(err);
              }
            } else {
              try {
                await got.post(`${baseUrl}/api/flow/functions`, { headers, json });
                log(ok(`Flow Function "${json.fqn}" has been created`));
              } catch (err) {
                log(error(`Flow Function "${json.fqn}" could not be created`));
                handleApiError(err);
              }
            }
          }
        } catch (err) {
          log(error(err));
        }
      }
      return resolve();
    });
  });
}

function handleApiError(err) {
  if (err.response) {
    try {
      const body = JSON.parse(err.response.body);
      log(error(`${body.statusCode || err.response.statusCode} ${body.error || err.response.statusMessage}: ${body.message}`));
    } catch (e) {
      log(error(`${err.response.statusCode} ${err.response.statusMessage}: ${err.response.body}`));
    }
  } else {
    log(error(err));
  }
}

function zipDirectory(source, out) {
  const archive = archiver('zip', { zlib: { level: 8 } });
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', (err) => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
}

function deleteFile(path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
}

function getProcess(cmd) {
  switch (cmd) {
    case CMD.BUILD:
      return './node_modules/.bin/tsc';
    case CMD.COPY:
      return './node_modules/.bin/copyfiles';
    case CMD.FORMAT:
      return './node_modules/.bin/prettier';
    case CMD.INSTALL:
      return 'npm';
    case CMD.LINT:
      return './node_modules/.bin/tslint';
    case CMD.RUN:
      return 'node';
    case CMD.TEST:
      return './node_modules/.bin/jest';
    case CMD.WATCH:
      return './node_modules/.bin/nodemon';
    default:
      return '';
  }
}

function getProcessArguments(cmd, project) {
  switch (cmd) {
    case CMD.BUILD: {
      const filename = path.join(project.location, 'tsconfig.module.json');
      const configFile = fs.existsSync(filename) ? filename : project.location;
      return ['-p', configFile];
    }
    case CMD.COPY:
      return [
        '-u',
        '1',
        '-e',
        `${project.location}/*.json`,
        '-e',
        `${project.location}/**/*.ts`,
        '-e',
        `${project.location}/**/test/**`,
        `${project.location}/**`,
        `${buildDir}/`,
      ];
    case CMD.FORMAT:
      return ['--write', '**/*.ts'];
    case CMD.INSTALL:
      return ['install', '--no-package-lock'];
    case CMD.LINT:
      return ['-p', project.location, 'stylish'];
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
  return new ora({
    color: 'magenta',
    spinner: 'bouncingBar',
    text: message,
  });
}

function checkIfAll(projectName) {
  if (projectName === 'all') {
    log(error(`Please specify a Project. Command can't be run for all.`));
    return true;
  }
  return false;
}

function checkEnvModules() {
  let missing = false;
  if (!apiUser) {
    log(error('"API_USER" env var is not set.'));
    missing = true;
  }
  if (!apiKey) {
    log(error('"API_KEY" env var is not set.'));
    missing = true;
  }
  if (!baseUrl) {
    log(error('"PLATFORM_URL" env var is not set.'));
    missing = true;
  }
  if (!realm) {
    log(error('"REALM" env var is not set.'));
    missing = true;
  }
  if (!buildDir) {
    log(error('"BUILD_DIR" env var is not set.'));
    missing = true;
  }
  return missing;
}
