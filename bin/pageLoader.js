#!/usr/bin/env node

import commander from 'commander';
import load from '../src/index.js';

commander.program
  .option('-o, --output [value]', 'output destination path', process.cwd())
  .arguments('<url>')
  .action((url) => load(url, commander.program.output))
  .parse(process.argv);
