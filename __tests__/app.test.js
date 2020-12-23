// @ts-check
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import nock from 'nock';
import axios from 'axios';
import adapter from 'axios/lib/adapters/http';

import load from '../src';

const hostname = 'https://ru.hexlet.io';
const pathname = '/professions';
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
  const fixtureFilename = 'professions.html';
  const pathToFixture = getPathToFixture(fixtureFilename);
  const fixture = await fs.readFile(pathToFixture, 'utf-8');
  nock(hostname)
    .get(pathname)
    .reply(200, fixture);

  const pathToLoadedFile = await load(href, pathToTempDir);
  expect(pathToLoadedFile).toBe(path.resolve(pathToTempDir, 'ru-hexlet-io-professions.html'));
  expect(await fs.readFile(pathToLoadedFile, 'utf-8')).toBe(fixture);
});
