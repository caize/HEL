var path = require("path"),
	debug = require("debug")("adminModel"),
	constVar = require(path.join(constVarPath)),	
	dbBase = require(path.join(constVar.modelPath, "dbBase")),
	stateCode = require(path.join(constVar.configPath, "stateCode")),
	until = require(path.join(constVar.untilPath, "until"));


var catalogModel = function() {};

var fn = catalogModel.prototype = dbBase.prototype;

fn.createCatalog = function(obj, func) {
	if (!(obj.name && obj.slug)) {
		func(stateCode.parMiss());
		return;
	}

	let val = {
		name: obj.name,
		parent: obj.parent ||0,
		slug: obj.slug,
		type: "catalog",
		value:obj.value||""
	}

	this.insert('meta', val, function(result) {
		if (result.state === 200) {
			func(result);
		} else {
			func(stateCode.sqlInsertFail());
		}
	})
};

fn.modifyCatalog = function(obj, func) {
	if (!obj.mid) {
		func(stateCode.parMiss());
		return;
	}
	let mid = obj.mid;
	delete obj.mid;
	let fields = ['name', 'slug', 'parent','value'];

	let resObj = until.filterObjFields(fields, obj);

	// //参数缺少
	// if(until.objLength(resObj)!=fields){
	// 	func(stateCode.parMiss());
	// 	return;
	// }

	this.updateOneRecord("meta", obj, {
		mid: mid
	}, function(result) {
		if (result.state !== 200) {
			func(stateCode.sqlUpdateFail({
				moreInfo: "目录分类修改(更新)失败"
			}));
			return;
		}
		func(result);
	});
}

fn.deleteCatalog = function(midArry, func) {
	if (!midArry) {
		func(stateCode.parMiss());
		return;
	}

	//将删除目录下的文章的目录关系
	let sqlR="update relationships set mid=1 where type='postCatalog' and mid in (";

	//删除目录信息sql
	let sql = "delete from meta where type='catalog' and mid in ( ";

	let questionMark = [];
	for (let i = 0; i < midArry.length; i++) {
		if(midArry[i]!==1){
			questionMark.push("?");	
		}
	}

	sql += questionMark.join() + " ) ;";
	sqlR+=questionMark.join()+") ;";

	debug(sql,midArry);	
	//删除目录与文章的联系
	this.query(sqlR,midArry,function(result){
		debug('文章与目录关系删除结果',result);
	});
	
	//删除目录
	this.query(sql, midArry, function(result) {
		if (result.state !== 200) {
			func(stateCode.sqlDeleteFail({
				moreInfo: "目录删除失败"
			}))
		} else {
			func(result);
		}
	});	
}

fn.getCatalog=function(func){
	var sql="select mid,name,slug,parent,value as template from meta where type='catalog';";
	this.query(sql,[],function(result){
		func(result);
	});
}

module.exports=exports=catalogModel;