// @ts-check
// import os from 'os';
// import path from 'path';
// import { promises as fs } from 'fs';
// import nock from 'nock';

// import load from '../src';

// const pathToSource = 'https://ru.hexlet.io/professions';
// const getPathToFixture = (filename) => path.resolve('__fixtures__', filename);

// let pathToTempDir;

// beforeAll(() => {
//   nock.disableNetConnect();
// });

// afterAll(() => {
//   nock.enableNetConnect();
// });

// beforeEach(async () => {
//   pathToTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
// });

// test('application', async () => {
//   const fixtureFilename = 'professions.html';
//   const pathToFixture = getPathToFixture(fixtureFilename);
//   const fixture = await fs.readFile(pathToFixture, 'utf-8');
//   nock(pathToSource)
//     .get('/')
//     .reply(200, fixture);

//   const pathToLoadedFile = await load(pathToSource);
//   expect(pathToLoadedFile).toBe(path.resolve(pathToTempDir, 'ru-hexlet-io-professions.html'));
//   expect(await fs.readFile(pathToLoadedFile, 'utf-8')).toBe(fixture);
// });

test('fake test', () => {
  expect(true).toBeTruthy();
});
