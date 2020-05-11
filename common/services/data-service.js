'use strict';
const util = require('util');
const xlsx = require('node-xlsx');
const fs = require('fs');

const readFile = (path)=>{
  // 读取xlsx、txt文件
  const ProReadFile = util.promisify(fs.readFile);
  const file_ext = path.match(/([^\.]+)$/g)[0];
  if (file_ext === 'xlsx') {
    return xlsx.parse(path);
  } else if (file_ext === 'txt') {
    return ProReadFile(path, 'utf-8');
  }
};

const arrArrToObjArr = (arr, keyNames)=> {
  // 将以数组为元素的数组，根据给定一组的键，转化为以对象为元素的数组
  return arr.map(ele=> {
    const obj = {};
    keyNames.map((key, ind)=>{
      obj[key] = ele[ind] ? ele[ind] : null;
    });
    return obj;
  });
};

const objArrToArrArr = (objArr, keyNames)=> {
  // 将以对象为元素的数组，根据给定一组的键，转化为以数组为元素的数组
  objArr.map(ele=>{
    const tmp_data = {};
    keyNames.map((key, ind)=>{
      tmp_data[key] = ele[ind];
    });
  });
};

const customedObjArrCutter = (keyNames)=>{
  // 操作对象为对象数组，将对象数组中的元素，只选取其中一部分的键作为新的对象数组元素
  return (ele)=>{
    const data = {};
    keyNames.map(key=>{
      data[key] = ele[key];
    });
    return data;
  };
};

const saveToLocal = async (localpath, var_name)=>{
  // 将某个变量保存到本地的文件
  fs.writeFileSync(localpath, JSON.stringify(var_name));
};

const changeOsspathFromFileAndSaveToLocalFile = async (filepath_txt_file_path, local_file_path)=>{
  const data_str = await readFile(filepath_txt_file_path);
  const data_arr = data_str.replace(/ /g, '').replace(/\/\//g, '/').replace(/\/mnt\/csa\//g, 'oss://').split('\n').filter(ele=>ele);
  const re = new RegExp(/\/Sample_(.*)\/Output/);
  const sample_data_mapping_arr = data_arr.map(ele=>{
    const tmp = {};
    tmp[re.exec(ele)[1]] = ele;
    return tmp;
  });
  fs.writeFileSync(local_file_path, JSON.stringify(sample_data_mapping_arr), 'utf-8');
  console.log();

  return sample_data_mapping_arr;
};
const read_filepath = async (filepath_txt_file_path)=>{
  // 这里写死了文件写入路径
  const local_file_path = 'xxx/mod_file_path.txt';
  return changeOsspathFromFileAndSaveToLocalFile(filepath_txt_file_path, local_file_path);
};

const changeStringDataToObjectData = (splited_data, colNames)=> {
// 提取以长字符串保存的数据
  return splited_data.map(ele=>{
    const row = ele.split('\t');
    const tmp_data = {};
    colNames.map((ele, ind)=>{
      tmp_data[ele] = row[ind] ? row[ind] : '';
    });
    return tmp_data;
  });
};
const data_format = (splited_data, colname)=> {
  return changeStringDataToObjectData(splited_data.filter(ele=>ele && ele[0] !== '#'), colname);
};

const extractKeyAndValueFromString = (str, filter) =>{
  // 从字符串中获取信息，返回一个object
  // e.g. 形如 str ="agewagag;key=value;sdags"的字符串,info_filter(str,'key')将返回{key:'value'}
  const myRegExp = new RegExp(`${filter}=([^;]*)`, 'g');
  if (str.match(myRegExp).length !== 1) {
    // console.log(str.match(myRegExp));
    throw 'err';
  }
  const val = str.match(myRegExp)[0].split('=');
  const _val = {};
  _val[val[0]] = val[1];
  return 	_val;
};
const info_filter = (str, filter) =>{
  return extractKeyAndValueFromString(str, filter);
};

const extractColsFormExcel = (path, sheetInd, cols)=>{
  // 从excel中读取某个表中的某几列，返回数组
  // 支持colInd为列Index组成的数组，或着表头字符串组成的数组
  const data = readFile(path);
  if (sheetInd !== undefined && typeof(sheetInd) == 'number' && sheetInd < data.length) {
    if (!cols)
      return data[sheetInd];
    else if (typeof(cols[0]) == 'undefined')
      throw ('err:wrong type');
    else if (typeof(cols[0]) == 'number') {
      if (cols.length == 1)
        return data[sheetInd].map(ele=>ele[cols]);
      else if (cols.length > 1) {
        return data[sheetInd].map(ele=>{
          const item = [];
          for (const col of cols) {
            item.push(ele[col]);
          }
          return item;
        });
      }
    } else if (typeof(cols[0]) == 'string') {
      const colIndex = cols.map(ele=>data[sheetInd]['data'][0].indexOf(ele));
      return data[sheetInd]['data'].map(ele=>{
        const item = [];
        for (const col of colIndex) {
          item.push(ele[col]);
        }
        return item;
      });
    }
  }
  return data;
};

module.exports = {
  readFile: readFile,
  arrArrToObjArr: arrArrToObjArr,
  objArrToArrArr: objArrToArrArr,
  customedObjArrCutter: customedObjArrCutter,
  info_filter: info_filter,
  data_format: data_format,
  read_filepath: read_filepath,
  saveToLocal: saveToLocal,
  changeStringDataToObjectData: changeStringDataToObjectData,
  extractKeyAndValueFromString: extractKeyAndValueFromString,
  changeOsspathFromFileAndSaveToLocalFile: changeOsspathFromFileAndSaveToLocalFile,
  extractColsFormExcel: extractColsFormExcel
};
