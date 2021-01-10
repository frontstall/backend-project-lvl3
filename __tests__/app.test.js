// @ts-check
import os from 'os';
import path from 'path';
import { promises as fs, createReadStream } from 'fs';
import nock from 'nock';
import axios from 'axios';
import adapter from 'axios/lib/adapters/http';

import load from '../src';

const hostname = 'https://smartrw.github.io';
const pathname = '/nerds';
const { href } = new URL(pathname, hostname);
const getPathToFixture = (filename) => path.resolve('__fixtures__', filename);

const assetsConfig = {
  'logo-1.png': {
    type: 'binary',
    dir: 'img',
  },
  'logo-2.png': {
    type: 'binary',
    dir: 'img',
  },
  'logo-3.png': {
    type: 'binary',
    dir: 'img',
  },
  'logo-4.png': {
    type: 'binary',
    dir: 'img',
  },
  'nerds-illustration.png': {
    type: 'binary',
    dir: 'img',
  },
  'normalize-min.css': {
    type: 'text',
    dir: 'css',
  },
  'style-min.css': {
    type: 'text',
    dir: 'css',
  },
  'script-min.js': {
    type: 'text',
    dir: 'js',
  },
};

const getHandler = (assetType, pathToAsset) => {
  const config = {
    binary: () => createReadStream(pathToAsset),
    text: async () => {
      const asset = await fs.readFile(pathToAsset);
      return asset;
    },
  };

  return config[assetType];
};

let pathToTempDir;

beforeAll(() => {
  axios.defaults.adapter = adapter;
  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
});

beforeEach(async () => {
  pathToTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('application', async () => {
  const expectedFileName = 'smartrw-github-io-nerds.html';
  const assetsDirectoryName = 'smartrw-github-io-nerds_files';
  const fixture = await fs.readFile(getPathToFixture('index.html'), 'utf-8');
  const expectedFileContent = await fs.readFile(getPathToFixture(expectedFileName), 'utf-8');
  nock(hostname)
    .get(pathname)
    .reply(200, fixture);

  Object.entries(assetsConfig).forEach(([assetName, { dir, type }]) => {
    const route = path.join(pathname, dir, assetName);
    const pathToAsset = getPathToFixture(path.join('assets', dir, assetName));

    const handler = getHandler(type, pathToAsset);

    nock(hostname)
      .get(route)
      .reply(200, handler);
  });

  const pathToLoadedFile = await load(href, pathToTempDir);
  expect(pathToLoadedFile).toBe(path.resolve(pathToTempDir, expectedFileName));
  expect(await fs.readFile(pathToLoadedFile, 'utf-8')).toBe(expectedFileContent);

  const pathToAssetsDirectory = path.resolve(pathToTempDir, assetsDirectoryName);
  const assetsFilenames = await fs.readdir(pathToAssetsDirectory);
  const expectedAssetsFilenames = await fs.readdir(getPathToFixture(assetsDirectoryName));
  expect(assetsFilenames.sort()).toEqual(expectedAssetsFilenames.sort());
});
