#!/usr/bin/env node

import { program } from 'commander';
import load from '../src';

program
  .option('-o, --output [value]', 'output destination path', process.cwd())
  .arguments('<url>')
  .action((url) => load(url, program.output))
  .parse(process.argv);
