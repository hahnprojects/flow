#!/usr/bin/env node
require('reflect-metadata');

const archiver = require('archiver');
let axios = require('axios').default;
const chalk = require('chalk');
const { Command } = require('commander');
const copyfiles = require('copyfiles');
const execa = require('execa');
const FormData = require('form-data');
const fs = require('fs');
const glob = require('glob');
const HttpsProxyAgent = require('https-proxy-agent');
const ora = require('ora');
const path = require('path');

require('dotenv').config();

/* eslint-disable-next-line no-console */
const log = console.log;
const ok = chalk.bold.green;
const error = chalk.bold.red;

const apiUser = process.env.API_USER;
const apiKey = process.env.API_KEY;
const baseUrl = process.env.PLATFORM_URL;
const buildDir = process.env.BUILD_DIR || 'dist';
const realm = process.env.REALM;
const authUrl = process.env.AUTH_URL || `${baseUrl}/auth/realms/${realm}/protocol/openid-connect/token`;

if (process.env.https_proxy || process.env.http_proxy) {
  const httpsAgent = new HttpsProxyAgent(process.env.https_proxy || process.env.http_proxy);
  axios = axios.create({ httpsAgent, proxy: false });
}

let apiToken;
let projectsRoot = 'modules';

const CMD = {
  AUDIT: 'audit',
  BUILD: 'build',
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
  .version('2.10.0', '-v, --version')
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
    } catch (err) {
      if (err) log(err);
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
    } catch (err) {
      if (err) log(err);
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
    } catch (err) {
      if (err) log(err);
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
    } catch (err) {
      if (err) log(err);
      process.exit(1);
    }
  });

program
  .command('format')
  .description('Formats all typescript files according to prettier configuration')
  .action(async () => {
    try {
      await exec(CMD.FORMAT, { name: 'all' });
    } catch (err) {
      if (err) log(err);
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
      await clean(buildDir);
      await exec(CMD.INSTALL, project);
      await exec(CMD.BUILD, project);
      await copyProjectFiles(project);
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
  .option('-s, --skip', 'skip modules that already exists with the current version')
  .description('Publishes specified Module to Cloud Platform')
  .action(async (projectName, options) => {
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
        await copyProjectFiles(project);
        await validateModule(project);
        try {
          await publishModule(project);
        } catch (e) {
          if (
            options.skip &&
            e &&
            e.response &&
            e.response.data &&
            e.response.data.message === 'New module version must greater than latest version'
          ) {
            log(ok(`Module "${project.name}" is up to date. Skipping.`));
          } else {
            log(error(`Publishing Module "${project.name}" failed.`));
            handleApiError(e);
            process.exit(1);
          }
        }
        if (options.functions) {
          await publishFunctions(project, options.update);
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
  .description('Publishes all Flow Functions inside specified Module to Cloud Platform')
  .action(async (projectName, options) => {
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
        await publishFunctions(project, options.update);
      }
    } catch (err) {
      if (err) log(err);
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
    } catch (err) {
      if (err) log(err);
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
    } catch (err) {
      if (err) log(err);
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
    } catch (err) {
      if (err) log(err);
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
      glob('**/*.*', globOptions, async (err, files) => {
        const filtered = files.filter((file) => !file.endsWith('.spec.ts'));
        const tsJsonMap = filtered.reduce((acc, cur, i, arr) => {
          if (cur.endsWith('.ts')) {
            // get json file for current function
            const json = arr.find((v) => v === `${cur.split('.')[0]}.json`);
            if (json) {
              acc.push({
                ts: path.join(globOptions.cwd, cur),
                json: path.join(globOptions.cwd, json),
              });
            }
          }
          return acc;
        }, []);
        tsJsonMap.forEach((entry) => {
          generateSchemasForFile(entry.ts, entry.json);
        });
      });
    } catch (err) {
      if (err) log(err);
      process.exit(1);
    }
  });

if (process.env.NODE_ENV !== 'test') {
  program.parse(process.argv);
}

function generateSchemasForFile(tsPath, jsonPath) {
  // get schema
  let json = require(path.join(process.cwd(), jsonPath));

  const filePath = path.join(process.cwd(), tsPath);
  const tsFile = String(fs.readFileSync(filePath));
  const dir = path.dirname(filePath);

  execa('ts-node', ['-T', '--dir', dir], { input: prepareTsFile(tsFile), preferLocal: true }).then((result) => {
    json = handleConvertedOutput(result.stdout, jsonPath, json);

    fs.writeFileSync(path.join(process.cwd(), jsonPath), JSON.stringify(json, null, 2) + '\n');
  });
}

function handleConvertedOutput(result, jsonPath, json) {
  let schema;
  try {
    schema = JSON.parse(result);
  } catch (e) {
    log(error(result));
    return json;
  }
  [
    ['propertiesSchema', 'Properties'],
    ['inputStreams', 'InputProperties'],
    ['outputStreams', 'OutputProperties'],
  ].forEach((value) => {
    const propsSchema = schema[value[1]] || {};
    (propsSchema.required || []).forEach((reqProp) => {
      propsSchema.properties[reqProp] = { ...propsSchema.properties[reqProp], required: true };
    });
    // remove required field
    delete propsSchema.required;

    checkTypes(getTypes(jsonPath), propsSchema, jsonPath);

    const completeSchema = {
      schema: {
        type: 'object',
        properties: {
          ...propsSchema.properties,
        },
      },
    };

    if (value[0] === 'propertiesSchema') {
      if (!json['propertiesSchema']) {
        json['propertiesSchema'] = completeSchema;
      }
    } else {
      // check if config for default input/output stream exists
      if (!json[value[0]].find((v) => v.name === 'default')) {
        if (propsSchema) {
          json[value[0]].push({
            name: 'default',
            ...completeSchema,
          });
        }
      }
    }
  });

  // add definitions
  if (Object.keys(schema).some((key) => !['Properties', 'InputProperties', 'OutputProperties'].includes(key))) {
    const typeDefinitions = Object.keys(schema).filter((key) => !['Properties', 'InputProperties', 'OutputProperties'].includes(key));
    json.definitions = typeDefinitions.reduce((previousValue, currentValue) => {
      const additionalSchema = schema[currentValue];
      (additionalSchema.required || []).forEach((reqProp) => {
        additionalSchema.properties[reqProp] = { ...additionalSchema.properties[reqProp], required: true };
      });
      delete additionalSchema.required;
      previousValue[currentValue] = additionalSchema;
      return previousValue;
    }, {});
  }
  return json;
}

function checkTypes(definedTypes, propsSchema, jsonPath) {
  const knownTypes = [
    ...definedTypes,
    'string',
    'undefined',
    'number',
    'boolean',
    'any',
    'object',
    'array',
    'integer',
    'Asset',
    'AssetType',
    'Flow',
    'Secret',
    'TimeSeries',
  ];

  // check if all types are known
  const props = propsSchema.properties || {};
  for (const prop of Object.keys(props)) {
    if (props[prop].type && !knownTypes.includes(props[prop].type)) {
      /* eslint-disable-next-line no-console */
      console.log(
        error(`ERROR: unknown type ${props[prop].type}.
       Please add a schema for this type in ${jsonPath}
       for more info check the documentation`),
      );
      return false;
    }
  }
  return true;
}

function prepareTsFile(file) {
  // if a class extends another and does not have its own fields no metadata is generated and so no schema can be generated
  // in this case replace empty block with the block it inherits from
  let codeBlocks = getCodeBlocks(file);
  const emptyExtendsBlock = codeBlocks.find((block) => classNameIncludes(block, 'extends') && isBlockEmpty(block));
  if (emptyExtendsBlock) {
    // replace block and remove extends
    let replBlock = `${emptyExtendsBlock}`;
    if (replBlock.replace(/\s\s+/g, ' ').trim().startsWith('class OutputProperties')) {
      // remove extends
      replBlock = replBlock.replace('extends InputProperties', '');
      // replace block with InputProperties block
      const inputPropsBlock = codeBlocks.find((v) => classNameIncludes(v, 'InputProperties') && !classNameIncludes(v, 'OutputProperties'));
      replBlock = replBlock.replace(getBlockContent(replBlock), getBlockContent(inputPropsBlock));

      file = file.replace(emptyExtendsBlock, replBlock);
    }
  }
  return (
    `import { validationMetadatasToSchemas as v } from 'class-validator-jsonschema';\n` +
    `import { defaultMetadataStorage as classTransformerDefaultMetadataStorage } from 'class-transformer/cjs/storage';\n` +
    `${file}\n` +
    `const s = v({\n
      additionalConverters: {\n
        UnitArgsValidator: (meta) => {\n
          return {\n
            measure: meta.constraints[0],\n
            unit: meta.constraints[1],\n
            type: 'number',\n
          };\n
        },\n
      },\n
      classTransformerMetadataStorage\n
    });\n` +
    `console.log(JSON.stringify(s));`
  );
}

function getCodeBlocks(str) {
  const blocks = [];
  let counter = 0;
  let start = 0;
  let lastNewline = 0;
  [...str].forEach((char, index) => {
    if (char === '\n') {
      lastNewline = index;
    }
    if (char === '{') {
      if (counter === 0) {
        // first bracket of block
        start = lastNewline;
      }
      counter++;
    } else if (char === '}') {
      counter--;
      if (counter === 0) {
        // last bracket of block
        blocks.push(str.substring(start, index + 1));
      }
    }
  });
  return blocks;
}

function classNameIncludes(str, className) {
  return str.trim().split('\n', 1)[0].includes(className);
}

function getBlockContent(block) {
  return block.substring(block.indexOf('{'), block.lastIndexOf('}') + 1);
}

function isBlockEmpty(block) {
  const blockContent = block.substring(block.indexOf('{') + 1, block.lastIndexOf('}'));
  return !blockContent.trim();
}

function getTypes(filePath) {
  try {
    const json = require(path.join(process.cwd(), filePath));
    return json.definitions ? Object.keys(json.definitions) : [];
  } catch (e) {
    return [];
  }
}

async function clean(buildFolder) {
  return new Promise((resolve, reject) => {
    const spinner = getSpinner('Cleaning').start();
    fs.rmdir(buildFolder, { recursive: true }, (err) => {
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
      log(`${chalk.red('Wrong command options.')} Type "hpc ${cmd} --help" to see how to use this command`);
      return reject();
    }

    const options = { ...getProcessOptions(cmd, project), env: process.env };
    if (cmd === CMD.RUN || cmd === CMD.WATCH) {
      log(ok(`\n${getLabel(cmd)} ${project.name}:\n`));
      execa(getProcess(cmd), getProcessArguments(cmd, project), options).stdout.pipe(process.stdout);
    } else {
      const spinner = getSpinner(`${getLabel(cmd)} ${project.name}`);
      spinner.start();
      execa(getProcess(cmd), getProcessArguments(cmd, project), options)
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

  const rootPkg = await readJson(path.join(process.cwd(), 'package.json'));

  const projects = [];
  const files = await readDir(projectsRoot);
  if (files) {
    for (const file of files) {
      if (file && (await isDir(path.join(projectsRoot, file)))) {
        const projectPath = path.join(projectsRoot, file, 'package.json');
        if (await isProject(path.join(projectsRoot, file))) {
          try {
            const pkg = await readJson(path.join(path.dirname(projectPath), 'package.json'));
            pkg.location = path.posix.join(projectsRoot, file);
            pkg.dist = path.posix.join(process.cwd(), buildDir, file);
            if (rootPkg) {
              pkg.dependencies = { ...pkg.dependencies, ...rootPkg.dependencies };
              pkg.repository = rootPkg.repository;
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
      log(error('No project specified'));
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
      const params = new URLSearchParams([
        ['client_id', apiUser],
        ['client_secret', apiKey],
        ['grant_type', 'client_credentials'],
      ]);
      const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      const response = (await axios.post(authUrl, params.toString(), { headers })).data;

      if (!response || !response.access_token) {
        throw new Error();
      }
      apiToken = response.access_token;
      log(ok('AccessToken acquired'));
      return resolve();
    } catch (err) {
      log(error('Could not get AccessToken'));
      handleApiError(err);
      return reject();
    }
  });
}

async function packageModule(project) {
  const { location, dist, ...package } = project;
  const file = path.posix.join(dist, '..', `${project.name}.zip`);
  await writeJson(path.join(dist, 'package.json'), package);
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
      await axios.post(`${baseUrl}/api/flow/modules`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${apiToken}`,
        },
      });

      log(ok(`Module "${project.name}" published!`));
      return resolve();
    } catch (err) {
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
                await axios.put(`${baseUrl}/api/flow/functions/${json.fqn}`, json, { headers });
                log(ok(`Flow Function "${json.fqn}" has been updated`));
              } catch (err) {
                log(error(`Flow Function "${json.fqn}" could not be updated`));
                handleApiError(err);
              }
            } else {
              try {
                await axios.post(`${baseUrl}/api/flow/functions`, json, { headers });
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
  if (err.isAxiosError && err.response) {
    log(error(`${err.response.status} ${err.response.statusText}`));
    if (err.response.data) {
      log(error(JSON.stringify(err.response.data)));
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
      [`${project.location}/**`, `${buildDir}/`],
      {
        exclude: [`${project.location}/*.json`, `${project.location}/**/*.ts`, `${project.location}/**/test/**`],
        up: 1,
      },
      (err) => {
        if (err) {
          return reject(err);
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
    log(error(`Please specify a project. Command can't be run for all.`));
    return true;
  }
  return false;
}

function checkEnvModules() {
  let missing = false;
  if (!apiUser) {
    log(error('"API_USER" env var is not set'));
    missing = true;
  }
  if (!apiKey) {
    log(error('"API_KEY" env var is not set'));
    missing = true;
  }
  if (!baseUrl) {
    log(error('"PLATFORM_URL" env var is not set'));
    missing = true;
  }
  if (!realm) {
    log(error('"REALM" env var is not set'));
    missing = true;
  }
  if (!buildDir) {
    log(error('"BUILD_DIR" env var is not set'));
    missing = true;
  }
  return missing;
}

function readJson(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf8' }, (err, data) => {
      if (err) return reject(err);
      try {
        return resolve(JSON.parse(data));
      } catch (e) {
        return reject(e);
      }
    });
  });
}

function writeJson(path, data) {
  return new Promise((resolve, reject) => {
    let dataString;
    try {
      dataString = JSON.stringify(data, null, 2) + '\n';
    } catch (err) {
      return reject(err);
    }
    fs.writeFile(path, dataString, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
}

exports.prepareTsFile = prepareTsFile;
exports.getCodeBlocks = getCodeBlocks;
exports.checkTypes = checkTypes;
exports.getTypes = getTypes;
exports.handleConvertedOutput = handleConvertedOutput;
