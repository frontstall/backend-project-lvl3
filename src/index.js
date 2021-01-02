import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

const urlToFilename = (string) => {
  const placeholder = '-';
  const extension = '.html';
  const url = new URL(string);
  const urlWithoutProtocol = `${url.hostname}${url.pathname}`;
  const filename = urlWithoutProtocol
    .replace(/[^A-z]/g, placeholder)
    .concat(extension);
  return filename;
};

const load = (url, outputDirPath) => {
  let pathToFile;
  return axios.get(url)
    .then((response) => {
      const { data } = response;
      const fileName = urlToFilename(url);
      pathToFile = path.join(outputDirPath, fileName);
      return fs.writeFile(pathToFile, data, 'utf-8');
    })
    .then(() => pathToFile)
    .catch((err) => {
      console.error(err.isAxiosError ? 'Network error' : 'Unknown pizdec');
      throw err;
    });
};

export default load;
