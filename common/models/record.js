'use strict';
const DataService = require('../services/data-service');

module.exports = function(Record) {
  Record.initData = async(body)=>{
    const filePath = '/Users/axah/Desktop/流水表.xlsx';
    const data = await DataService.readFile(filePath);
    const colNames = data[0].data[0];
    const content = data[0].data.slice(1);
    const dbColNames = ['id', 'record_date', 'happen_date', 'trading_time', 'expend', 'income', 'balance', 'col1', 'abstract',
      'opposite_account', 'opposite_name', 'trading_place', 'project_id_m', 'bank_id'];

    let arrObj = DataService.arrArrToObjArr(content, dbColNames);
    for (const ele of arrObj) {
      ele.record_date = new Date(ele.record_date);
      ele.happen_date = new Date(ele.happen_date);
      ele.expend = ele.expend ? ele.expend : 0;
      ele.income = ele.income ? ele.income : 0;
      ele.balance = ele.balance ? ele.balance : 0;
    }
    const N  = arrObj.length;
    const promiseList = arrObj.slice(0, N).map(async (ele)=>{
      return Record.patchOrCreate(ele);
    });
    await Promise.all(promiseList);
    return {'result': 'success'};
  };
  Record.remoteMethod('initData', {
    description: '初始化数据库',
    accepts: [
	{arg: 'body', type: 'object', required: false, http: {source: 'body'}}
    ],
    returns: [
	{arg: 'data', type: 'object', root: true}
    ],
    http: {
      verb: 'post',
      path: '/init-data'
    }
  });

  Record.findByProjectIdM = async(projectIdM)=>{
    const data = await  Record.find({where: {
      project_id_m: projectIdM
    }});
    return {data};
  };
  Record.remoteMethod('findByProjectIdM', {
    description: '通过project_id_m获取记录',
    accepts: [
	{arg: 'project_id_m', type: 'string', required: true, http: {source: 'query'}}
    ],
    returns: [
	{arg: 'data', type: 'object', root: true}
    ],
    http: {
      verb: 'get',
      path: '/get-project-items'
    }
  });
};
