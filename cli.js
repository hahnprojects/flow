#!/usr/bin/env node

const AdmZip = require('adm-zip');
const chalk = require('chalk');
const program = require('commander');
const execa = require('execa');
const fs = require('fs');
const ora = require('ora');
const path = require('path');
const readPkg = require('read-pkg');
const request = require('request-promise-native');
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
const targetUrl = process.env.TARGET_URL || `${baseUrl}/api/flow/modules`;

let apiToken;
let projectsRoot = 'modules';

const CMD = {
  BUILD: 'build',
  COPY: 'copy',
  FORMAT: 'format',
  LINT: 'lint',
  PUBLISH: 'publish',
  RUN: 'run',
  TEST: 'test',
  WATCH: 'watch',
};

program
  .version('1.1.1', '-v, --version')
  .usage('[command] [options]')
  .description('Flow Module Management Tool.')
  .on('--help', () => {});

program
  .command('build [projectName]')
  .description('Builds specified Project.')
  .action(async (projectName) => {
    try {
      const project = await findProject(projectName);
      await exec(CMD.BUILD, project);
      await exec(CMD.LINT, project);
      await exec(CMD.COPY, project);
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

program
  .command('publish-module [projectName]')
  .description('Publishes specified Module to Cloud Platform.')
  .action(async (projectName) => {
    try {
      if (checkIfAll(projectName)) process.exit(1);
      if (checkEnvModules()) process.exit(1);
      const project = await findProject(projectName);
      await clean(buildDir);
      await exec(CMD.BUILD, project);
      await exec(CMD.LINT, project);
      await exec(CMD.COPY, project);
      await getAccessToken();
      await publishModule(project);
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
      const project = await findProject(projectName);
      await exec(CMD.BUILD, project);
      await exec(CMD.COPY, project);
      await exec(CMD.TEST, project);
    } catch (err) {
      if (err) log(err);
      process.exit(1);
    }
  });

program.parse(process.argv);
if (program.rawArgs.length < 3) {
  program.help();
}

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
      execa(getProcess(cmd), getProcessArguments(cmd, project)).stdout.pipe(process.stdout);
    } else {
      const spinner = getSpinner(`${getLabel(cmd)} ${project.name}`);
      spinner.start();
      execa(getProcess(cmd), getProcessArguments(cmd, project))
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
            if (rootPkg) {
              pkg.dependencies = rootPkg.dependencies || {};
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
        if (dirName !== project.fqn) {
          return reject(new Error('Folder name of Module must match its fqn.'));
        } else {
          return resolve(project);
        }
      }
    }

    log(error(`Cloud not find ${projectName} Module.`));
    reject();
  });
}

async function getAccessToken() {
  const options = {
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
    },
    form: {
      client_id: apiUser,
      client_secret: apiKey,
      grant_type: 'client_credentials',
    },
    url: authUrl,
  };
  return new Promise((resolve, reject) => {
    request.post(options, (err, res, body) => {
      if (err) {
        log(error('Could not get AccessToken'));
        return reject(err);
      }
      try {
        const data = JSON.parse(body);
        if (!data || !data.access_token) {
          throw new Error();
        }
        apiToken = data.access_token;
        log(ok('AccessToken acquired'));
        return resolve();
      } catch (err) {
        log(error('Could not get AccessToken'));
        return reject(err);
      }
    });
  });
}

async function publishModule(project) {
  return new Promise(async (resolve, reject) => {
    const dir = `${buildDir}/${project.fqn}`;
    const file = `${project.name}.zip`;

    await writePkg(dir, project, { normalize: false });
    const zip = new AdmZip();
    zip.addLocalFolder(dir);
    zip.writeZip(file);

    const reqOptions = {
      formData: {
        file: fs.createReadStream(file),
        fqn: project.fqn,
        name: project.name,
        description: project.description || '',
        version: project.version || '',
      },
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-type': 'multipart/form-data',
      },
      url: targetUrl,
    };

    request.post(reqOptions, (err, res, body) => {
      if (err) {
        log(error('Publishing Module failed.'));
        deleteFile(`${project.name}.zip`);
        return reject(err);
      }
      if (res && res.statusCode >= 400) {
        log(error('Publishing Module failed.'));
        log(error(body));
        deleteFile(`${project.name}.zip`);
        return reject(err);
      }
      log(ok('Module published!'));
      deleteFile(`${project.name}.zip`);
      return resolve();
    });
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
    case CMD.LINT:
      return './node_modules/.bin/tslint';
    case CMD.RUN:
      return 'node';
    case CMD.TEST:
      return 'jest';
    case CMD.WATCH:
      return './node_modules/.bin/nodemon';
    default:
      return '';
  }
}

function getProcessArguments(cmd, project) {
  switch (cmd) {
    case CMD.BUILD:
      return ['-p', project.location];
    case CMD.COPY:
      return ['-u', '1', `${projectsRoot}/**/*.py`, `${buildDir}/`];
    case CMD.FORMAT:
      return ['--write', '**/*.ts'];
    case CMD.LINT:
      return ['-p', project.location, 'stylish'];
    case CMD.RUN:
      return [project.location];
    case CMD.TEST:
      return project.name === 'all'
        ? ['--runInBand', '--coverage', '--forceExit', '--verbose']
        : ['roots', project.location, '--forceExit', '--verbose'];
    case CMD.WATCH:
      return ['--inspect', project.location];
    default:
      return [];
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
