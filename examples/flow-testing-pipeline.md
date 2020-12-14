## CI Testing of Flow Function Unit-Tests

These examples are for the Gitlab CI, but can be easily adapted to run in any
CI environment.

### Preparation

CI tests are designed to test your code and your code only. This means the Flow-Functions
should not rely on the availability of the API. A test, that relys on the API,
could fail either because there is an actual problem with the code or because
the API is unavailable. The availability of the API should not affect the
outcome of the tests.

To ensure this the tests can use the provided Mock-API. The Mock-API
allows you to preset data that then gets used in the tests. It is a
drop-in-replacement for the standard API.

If your tests can't be adapted to use the API you could set the
environment variables `API_BASE_URL, API_USER, AUTH_SECRET` in the secrets
settings of your repository [Gitlab docs](https://docs.gitlab.com/ee/ci/variables/).

**This approach is strongly discouraged!**

Another option is to exclude the entire module from CI testing by setting
the `excludeTestsInCI` option to `true` in the modules `package.json`.

(Note the Flow-CLI determines its environment by checking the `CI` environment variable)

### Setting up the CI config

#### Setup testing environment

To run the tests you have to set up the environment similar to the
flow-executor. This means installing the flow-cli and -sdk (These should
already be root-dependencies of your repo) and installing the needed python
dependencies. As the RPC based python integration uses rabbitmq, this
service has be provided.

#### Running the tests

The Flow-CLI includes all the functionality needed for this. Simply run:

```shell script
flow install all
flow test all
```

#### Example CI config

```yaml
stages:
  - test

flow-modules:
  stage: test
  image: nikolaik/python-nodejs:python3.8-nodejs14
  services:
    - rabbitmq:3
  before_script:
    - apt-get update
    - apt-get install -y python3-numpy python3-pandas
    - pip install dateutils dictdiffer glob3 h5py hyperopt==0.2.3 lxml matplotlib numpy==1.18.5 opencv-contrib-python-headless pandas pathlib pika scikit-learn scipy==1.4.1 tensorflow-cpu voluptuous
    - npm install --quiet
  script:
    - flow install all
    - flow test all
```
