/**
 * A FIS3 plugin to generate html file with i18n data in deploy stage
 * Copyright (c) 2017
 * All rights reserved
 *
 * Author: tonyc726@gmail.com
 */

import isGlob from 'is-glob';
import { merge, isString, noop, forEach, isEmpty } from 'lodash';

import compileFileToI18nData from './utils/compileFileToI18nData';

var fs = require('fs')
var path = require('path')
/**
 * @type {Object} DEFAULT_CONFIG - 插件默认配置
 * @property {string} [open='<%'] - ejs模板的起始标识符
 * @property {string} [close='%>'] - ejs模板的结束标识符
 * @property {string} [dist='i18n/$lang/$file'] - 编译后的输出路径，相对于release的根目录，其中`$lang`代表语言文件夹，`$file`代表编译的文件
 * @property {string} [templatePattern=''] - 需要做多语言处理文件subpath的glob规则，默认为所有html文件
 * @property {string} [defaultLangName=''] - 默认语言名字，如果匹配默认语言，该语言的输出将自动去除dist中的`$lang`部分
 * @property {string} [i18nPattern='translations/*.{js,json}'] - 多语言文件的glob规则
 * @property {string} [ignorePattern=''] - 需要忽略编译的glob规则
 * @property {string} [noKeepSubPathPattern=''] - 不需要保持原有目录结构输出的glob规则
 * @property {function} [onLangFileParse=noop] - 在读取多语言文件后的自定义处理函数，其返回值会与当前读取的文件内容合并
 */

function replaceStr(str, replaceObj, startFlag, endFlag) {
  startFlag = startFlag || '__\\(\'';
  endFlag = endFlag || '\'\\)';
  const reg = new RegExp(startFlag + '.+?' + endFlag, 'g');
  const result = str.replace(reg, function(item) {
    let key = item.replace(/__\('/, '').replace(/'\)/, '');
    let returnValue = replaceObj[key] || key;
    return "'" + returnValue + "'";
  });
  return result;
}

const DEFAULT_CONFIG = {
  open: '<%',
  close: '%>',
  dist: 'i18n/$lang/$file',
  templatePattern: '',
  defaultLangName: '',
  i18nPattern: 'translations/*.{js,json}',
  ignorePattern: '',
  noKeepSubPathPattern: '',
  /**
   * @desc 多语言文件处理函数
   * @param {string} i18nFileJSONClone - 语言文件内容(JSON格式)的拷贝对象
   * @param {string} fileLangName - 当前语言文件对应的语言名字
   * @param {string} defaultLangName - 默认语言名字
   * @return {object} 处理以后的文件内容
   *
   * @example
   * onLangFileParse(i18nFileJSONClone, fileLangName, defaultLangName) {},
   */
  // onLangFileParse: noop,
};

/**
 * FIS3 deploy i18n plugin
 *
 * http://fis.baidu.com/fis3/docs/api/dev-plugin.html
 * @param {object} options - 插件配置
 * @param {object} modified - 修改了的文件列表（对应watch功能）
 * @param {object} total - 所有文件列表
 * @param {function} next - 调用下一个插件
 * @return {undefined}
 */
export default (options, modified, total, fisDeployNextEvent) => {
  const config = merge(DEFAULT_CONFIG, options);
  const defaultLangName = config.defaultLangName || null;

  // 首先检测必须的参数
  // 参数有误则报错，并进入下一个fis的事件中
  if (
    !isGlob(config.i18nPattern) ||
    !isString(config.dist) ||
    config.dist.indexOf('$lang') < 0 ||
    config.dist.indexOf('$file') < 0
  ) {
    // eslint-disable-next-line no-undef
    fis.log.warn('fis3-deploy-i18n-ejs: wrong configurations.');
    fisDeployNextEvent();
  } else {
    // 根据i18nPattern读取文件并编译成i18nData
    const i18nData = compileFileToI18nData(
      config.i18nPattern,
      // eslint-disable-next-line no-undef
      fis.project.getProjectPath(),
      defaultLangName,
      config.onLangFileParse,
    );

    // 如果为找到多语言文件，输出报错信息，自动进入下一个fis的事件中
    if (isEmpty(i18nData)) {
      // eslint-disable-next-line no-undef
      fis.log.warn("fis3-deploy-i18n-ejs: can't found i18n files.");
      fisDeployNextEvent();
    } else {
      // ejs compile config
      const ejsCompilerOptions = {
        open: config.open,
        close: config.close,
      };
      const defaultLangNameRegExp =
        defaultLangName === null
          ? null
          : new RegExp(`${defaultLangName}`, 'gi');
      const ejsCompilerResult = [];
      const needRemoveIndexs = [];

      /**
       * @see http://fis.baidu.com/fis3/api/fis.file-File.html
       *
       * @param {string}  modifiedFile.ext - 文件名后缀
       * @param {string}  modifiedFile.filename - 文件名，没有后缀
       * @param {string}  modifiedFile.basename - 文件名
       * @param {string}  modifiedFile.realpath - 文件物理地址
       * @param {string}  modifiedFile.realpathNoExt - 文件物理地址，没有后缀
       * @param {string}  modifiedFile.subpath - 文件基于项目 root 的绝对路径
       * @param {string}  modifiedFile.subdirname - 文件基于项目 root 的绝对路径，仅文件夹目录
       * @param {string}  modifiedFile.subpathNoExt - 文件基于项目 root 的绝对路径，没有后缀
       * @param {string | boolean}  modifiedFile.release - 文件的发布路径，当值为 false 时，文件不会发布
       *
       * @example
       *
       * [{
       *   "ext": ".fileExt",
       *   "filename": "fileName",
       *   "basename": "fileName.fileExt",
       *   "realpath": "/projectRootPath/fileParentDirPath/fileName.fileExt",
       *   "realpathNoExt": "/projectRootPath/fileParentDirPath/fileName",
       *   "subpath": "/fileParentDirPath/fileName.fileExt",
       *   "subdirname": "/fileParentDirPath",
       *   "subpathNoExt": "/fileParentDirPath/fileName",
       *   "release": "/fileParentDirPath/fileName.fileExt",
       * }...]
       */
      forEach(modified, (modifiedFile, modifiedFileIndex) => {
        if (
         true
        ) {
          const baseStr = modifiedFile.getContent().toString();
          
          // eslint-disable-next-line no-undef
          const distFilePath = fis.util.glob(
            config.noKeepSubPathPattern,
            modifiedFile.subpath,
          )
            ? modifiedFile.basename
            : modifiedFile.release;

          forEach(i18nData, (langData, langName) => {
            const filec = replaceStr(baseStr, i18nData[langName]);
            const distPath = config.dist
              .replace(/^\//, '')
              .replace(/\/$/, '')
              .replace(
                '$lang/',
                // 如果没有默认语言或者不匹配默认语言，
                // 则在文件输出路劲最外层加入`$lang/`的层级
                defaultLangNameRegExp === null ||
                !defaultLangNameRegExp.test(langName)
                  ? `${langName}/`
                  : '',
              )
              .replace('$file', distFilePath.replace(/^\//, ''));
            // eslint-disable-next-line no-undef
            const distFile = fis.file(fis.project.getProjectPath(), distPath);
            // distFile.setContent(fileCompiler(i18nData[langName]));
            distFile.setContent(filec);
            // save compiled result
            ejsCompilerResult.push(distFile);
          });

          // save the remove index
          needRemoveIndexs.push(modifiedFileIndex);
        }
      });

      if (ejsCompilerResult && ejsCompilerResult.length !== 0) {
        forEach(needRemoveIndexs, (removeIndex, i) => {
          modified.splice(removeIndex - i, 1);
        });

        forEach(ejsCompilerResult, (newModifiedFile) => {
          // 增加至 modified，用于deploy
          modified.push(newModifiedFile);
        });
      }

      // 由于是异步的如果后续还需要执行必须调用 fisDeployNextEvent
      fisDeployNextEvent();
    }
  }
};
