// @ts-check

import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import cheerio from 'cheerio';

const binaryFilesExtensions = ['.png', '.jpg', '.jpeg'];
const tagsToAttrs = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const isLocalLink = (link, origin) => {
  const url = new URL(link, origin);
  return url.origin === origin;
};

const parseLinkFromNode = (el) => {
  const attrName = tagsToAttrs[el.tagName];
  const link = el.attribs[attrName];

  return link;
};

const stringify = (string, placeholder = '-') => string.replace(/[^A-Za-z0-9]/g, placeholder);

const stringifyUrl = (string) => {
  const { hostname, pathname } = new URL(string);
  return stringify(`${hostname}${pathname}`);
};

const downloadBinaryFile = (url, pathToSave) => new Promise((resolve, reject) => {
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

const downloadTextFile = (url, pathToSave) => axios.get(url)
  .then(({ data }) => fs.writeFile(pathToSave, data, 'utf-8'));

const downloadFile = (url, pathToSave) => {
  const { ext } = path.parse(url);
  const isBinary = binaryFilesExtensions.includes(ext);
  const download = isBinary ? downloadBinaryFile : downloadTextFile;
  return download(url, pathToSave);
};

const load = (url, outputDirPath) => {
  const { origin, pathname } = new URL(url);
  const prefix = stringifyUrl(url);
  const pathToFile = path.format({
    dir: outputDirPath,
    name: prefix,
    ext: '.html',
  });
  const dirname = prefix.concat('_files');
  const pathToResources = path.join(outputDirPath, dirname);
  return axios.get(url)
    .then((response) => {
      const { data } = response;
      const $ = cheerio.load(data);
      const assets = $('img,link,script');

      const localAssets = assets.toArray().filter((el) => {
        const link = parseLinkFromNode(el);
        return isLocalLink(link, origin);
      });

      const pathsToLocalAssets = localAssets.map((el) => parseLinkFromNode(el));

      localAssets.forEach((el) => {
        const attrName = tagsToAttrs[el.tagName];
        const { dir, name, ext } = path.parse(el.attribs[attrName]);
        const assetPath = path.format({ dir, name });
        const assetName = `${prefix}-${stringify(assetPath)}`;
        const newAttrValue = path.format({
          dir: dirname,
          name: assetName,
          ext,
        });
        // eslint-disable-next-line no-param-reassign
        el.attribs[attrName] = newAttrValue;
      });

      const html = $.html();

      return Promise.all([pathsToLocalAssets, fs.writeFile(pathToFile, html, 'utf-8'), fs.mkdir(pathToResources)]);
    })
    .then(([paths]) => {
      const promises = paths
        .map((p) => {
          const { dir, name, ext } = path.parse(p);
          const assetName = `${stringifyUrl(origin)}${stringify(dir)}-${stringify(name)}`;
          const assetPath = path.format({ dir: pathToResources, name: assetName, ext });
          const assetUrl = new URL(path.join(pathname, p), origin);
          return downloadFile(assetUrl.href, assetPath);
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
