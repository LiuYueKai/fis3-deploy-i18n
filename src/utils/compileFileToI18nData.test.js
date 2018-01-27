import path from 'path';
import { pick } from 'lodash';

import compileFileToI18nData from './compileFileToI18nData';
import mockEnData from './__mock__/en.json';
import mockZhData from './__mock__/zh.json';

const MOCK_DATA = {
  en: mockEnData,
  zh: mockZhData,
};

test('default config', () => {
  expect(compileFileToI18nData(
    // pattern
    // cwd
    // defaultLangName
    // onFileParse
    // init
  )).toEqual({});
});

test('set pattern without glob rules', () => {
  expect(compileFileToI18nData(
    // pattern
    '\\*.json'
    // cwd
    // defaultLangName
    // onFileParse
    // init
  )).toEqual({});
});

// @see https://github.com/prettier/prettier/issues/1358
test('set pattern "{,!(node_modules)/**/}*.json", but without cwd', () => {
  expect(compileFileToI18nData(
    // pattern
    '{,!(node_modules)/**/}*.json',
    // cwd
    // defaultLangName
    // onFileParse
    // init
  )).toHaveProperty('package');
  expect(compileFileToI18nData(
    // pattern
    '{,!(node_modules)/**/}*.json',
    // cwd
    // defaultLangName
    // onFileParse
    // init
  )).toHaveProperty('en');
  expect(compileFileToI18nData(
    // pattern
    '{,!(node_modules)/**/}*.json',
    // cwd
    // defaultLangName
    // onFileParse
    // init
  )).toHaveProperty('zh');
});

// @see https://github.com/imsobear/blog/issues/48
test('set pattern "{,!(node_modules)/**/}*.{json,js}", with cwd "path.join(__dirname, \'__mock__\')"', () => {
  expect(compileFileToI18nData(
    // pattern
    '{,!(node_modules)/**/}*.{json,js}',
    // cwd
    path.join(__dirname, '__mock__'),
    // defaultLangName
    // onFileParse
    // init
  )).not.toHaveProperty('package');
  expect(compileFileToI18nData(
    // pattern
    '{,!(node_modules)/**/}*.{json,js}',
    // cwd
    path.join(__dirname, '__mock__'),
    // defaultLangName
    // onFileParse
    // init
  )).toHaveProperty('en');
  expect(compileFileToI18nData(
    // pattern
    '{,!(node_modules)/**/}*.{json,js}',
    // cwd
    path.join(__dirname, '__mock__'),
    // defaultLangName
    // onFileParse
    // init
  )).toHaveProperty('zh');
});

test('set pattern "{,!(node_modules)/**/}*.{json,js}", with cwd "path.join(__dirname, \'__mock__\')"', () => {
  expect(compileFileToI18nData(
    // pattern
    '{,!(node_modules)/**/}*.{json,js}',
    // cwd
    path.join(__dirname, '__mock__'),
    // defaultLangName
    // onFileParse
    // init
  )).toEqual(MOCK_DATA);
});

test('set pattern "{,!(node_modules)/**/}*.{json,js}", cwd "path.join(__dirname, \'__mock__\')", defaultLangName "en" and remove the defaultLangName data\'s prop[title].', () => {
  expect(compileFileToI18nData(
    // pattern
    '{,!(node_modules)/**/}*.{json,js}',
    // cwd
    path.join(__dirname, '__mock__'),
    // defaultLangName
    'en',
    // onFileParse
    (fileJSON, defaultLangName, fileName) => (
      fileName === defaultLangName ?
        pick(fileJSON, ['subdir.name']) :
        fileJSON
    )
    // init
  )).not.toHaveProperty('en.title');
});
