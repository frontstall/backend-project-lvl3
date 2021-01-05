// @ts-check

import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import cheerio from 'cheerio';

const imgExtensions = ['.png', '.jpg', '.jpeg'];

const stringify = (string, placeholder = '-') => string.replace(/[^A-Za-z0-9]/g, placeholder);

const stringifyUrl = (string) => {
  const url = new URL(string);
  return stringify(`${url.hostname}${url.pathname}`);
};

const downloadImage = (url, pathToSave) => new Promise((resolve, reject) => {
  let stream;
  axios
    .get(url, { responseType: 'stream' })
    .then(({ data }) => {
      stream = createWriteStream(pathToSave);
      stream.on('finish', resolve);
      stream.on('error', reject);
      data.pipe(stream);
    })
    .catch((e) => {
      if (stream) stream.destroy();
      reject(e);
    });
});

const load = (url, outputDirPath) => {
  const fileName = stringifyUrl(url);
  const pathToFile = path.format({
    dir: outputDirPath,
    name: fileName,
    ext: '.html',
  });
  const dirname = fileName.concat('_files');
  const pathToResources = path.join(outputDirPath, dirname);
  return axios.get(url)
    .then((response) => {
      const { data } = response;
      const $ = cheerio.load(data);
      const imgs = $('img').filter((_i, el) => {
        const { ext } = path.parse(el.attribs.src);

        return imgExtensions.includes(ext);
      });

      const imagesData = [];
      imgs.each((_i, el) => {
        const { dir, name, ext } = path.parse(el.attribs.src);
        const pathToImage = path.format({ dir, name });
        const imgFilename = [stringifyUrl(url), stringify(pathToImage)].join('-');
        const newSrc = path.format({
          dir: dirname,
          name: imgFilename,
          ext,
        });

        const { href } = new URL(el.attribs.src, url);

        imagesData.push({
          href,
          filename: path.format({ name: imgFilename, ext }),
        });
        el.attribs.src = newSrc;
      });

      const html = $.html();

      return Promise.all([imagesData, fs.writeFile(pathToFile, html, 'utf-8'), fs.mkdir(pathToResources), fs.writeFile('/home/roman/projects/backend-project-lvl3/__fixtures__/smartrw-github-io-nerds.html', html)]);
    })
    .then(([imagesData]) => {
      const promises = imagesData.map(({ href, filename }) => {
        const pathToImg = path.join(pathToResources, filename);
        return downloadImage(href, pathToImg);
      });
      return Promise.allSettled(promises);
    })
    .then(() => pathToFile)
    .catch((err) => {
      console.error(err.isAxiosError ? 'Network error' : 'Unknown pizdec');
      throw err;
    });
};

export default load;
