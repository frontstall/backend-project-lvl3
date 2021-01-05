// @ts-check
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import nock from 'nock';
import axios from 'axios';
import adapter from 'axios/lib/adapters/http';
import _ from 'lodash';

import load from '../src';

const hostname = 'https://smartrw.github.io';
const pathname = '/nerds';
const { href } = new URL(pathname, hostname);
const getPathToFixture = (filename) => path.resolve('__fixtures__', filename);

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
  const expectedFilename = 'smartrw-github-io-nerds.html';
  const expectedAssetsDirectoryName = 'smartrw-github-io-nerds_files';
  const expectedPathToAssetsDirectory = path.resolve(pathToTempDir, expectedAssetsDirectoryName);
  const index = await fs.readFile(getPathToFixture('index.html'), 'utf-8');
  const expected = await fs.readFile(getPathToFixture(expectedFilename), 'utf-8');
  nock(hostname)
    .get(pathname)
    .reply(200, index);

  const pathToLoadedFile = await load(href, pathToTempDir);
  expect(await fs.readFile(pathToLoadedFile, 'utf-8')).toBe(expected);

  expect(pathToLoadedFile).toBe(path.resolve(pathToTempDir, expectedFilename));

  const { path: pathToAssetsDirectory } = await fs.opendir(expectedPathToAssetsDirectory);
  expect(pathToAssetsDirectory).toBe(expectedPathToAssetsDirectory);

  const assetsFilenames = await fs.readdir(pathToAssetsDirectory);
  const expectedAssetsFilenames = await fs.readdir(expectedPathToAssetsDirectory);
  expect(_.difference(assetsFilenames, expectedAssetsFilenames)).toEqual([]);
});
