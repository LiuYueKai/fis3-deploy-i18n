import path from 'path';
import fs from 'fs';
import glob from 'glob';
import isGlob from 'is-glob';
import {
  merge,
  isPlainObject,
  isEmpty,
  isFunction,
  cloneDeep,
  forEach,
} from 'lodash';

/**
 * 根据glob遍历i18n资源文件生成i18n数据对象
 * 文件名即为语言名
 *
 * @param {string} pattern - 多语言文件的glob规则
 * @param {string} [cwd=process.cwd()] - 工作区路径，默认为当前命令执行的工作区，fis环境中使用项目根目录
 * @param {string} defaultLangName - 默认主语言名字
 * @param {function} onFileParse - 多语言文件的glob规则
 * @param {object} init - 初始化的i18n数据对象
 * @return {object}
 */
export default (
  pattern,
  cwd = process.cwd(),
  defaultLangName = '',
  onFileParse,
  init,
) => {
  const result = isPlainObject(init) && !isEmpty(init) ? cloneDeep(init) : {};

  // @see https://github.com/micromatch/is-glob
  if (isGlob(pattern)) {
    const i18nFiles = glob.sync(pattern, {
      cwd,
    });
    // 根据文件名即语言名的数据规则，组合新的i18n数据
    forEach(i18nFiles, (filePath) => {
      const fileAbsolutePath = path.join(cwd, filePath);
      const filePathParse = path.parse(fileAbsolutePath);
      const fileName = filePathParse.name;
      let fileJSON = null;
      try {
        fileJSON = JSON.parse(fs.readFileSync(fileAbsolutePath, 'utf8'));
      } catch (err) {
        console.error(`
Plugin(fis3-deploy-i18n-ejs/utils/compileFileToI18nData) Error:
${err}
        `);
      }

      merge(result, {
        // 如果存在语言处理函数，则使用处理后的结果
        [fileName]: !isFunction(onFileParse)
          ? fileJSON
          : onFileParse(fileJSON, defaultLangName, fileName),
      });
    });
  }

  return result;
};
