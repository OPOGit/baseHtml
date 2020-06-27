/**
 * 200627，针对blob对象的功能操作封装。
 */
!function(pptr,instanceName){
	/** 全局变量的定义。 */
	var 
		v_logTag = ""	// 日志的Tag标签，根据需要进行组织。
		;

	/** 函数对象的定义。 */
	var BlobAgent,
		f_main,
		f_prototypeExtend,
		f_gid,
		f_isEmpty,
		f_debug,
		f_error,

		f_blobSpliceBySize,
		f_getBlobFromFileByBinary,
		f_blobDownload;

	/**
	 * 200627，进行多个blob对象合并的封装。
	 * @param {Array[Blob]} blobArray 待合并的blob数组。
	 * @return {Blob} 合并后新的Blob对象。
	 */
	f_blobCombine = function(blobArray){
		return new Blob(blobArray);
	}

	/**
	 * 200627，将blob对象按指定大小分割。
	 * @param {Blob} 待处理的blob对象。
	 * @param {int} size 分割的文件大小。
	 * @return {Array[Blob]} blob对象的数组。
	 */
	f_blobSliceBySize = function(blob,size){
		var result,
			i,j;

		/* 参数获取、判断。 */
		result = [];
		if(blob.size<size){
			// 如果blob小于size，则直接返回。
			result.push(blob);
			return result; 
		}

		/* 进行blob的分块转换处理。 */
		for(i=0,j=blob.size;i<j;){
			result.push(blob.slice(i,i+=size));
		}

		// 返回结果。
		return result;
	}

	/**
	 * 200627，从file对象获取blob对象的封装。
	 * 采用Promise方式，以返回结果对象。
	 * @param {object} file HTML5中的File文件对象。可由input[type=file]对象的files属性获取。
	 * @return {blob} file对象的二进制内容。
	 */
	f_getBlobFromFileByBinary = function(file){
		return new Promise(function(resolve, reject){
			/* 进行文件对象的读取。 */
			var fileReader = new FileReader();
			fileReader.onload = function(){
				/* 文件装载完成后，进行blob对象的创建。 */
				var blob;
				blob = new Blob([this.result]);
				resolve(blob);
			}
			fileReader.readAsArrayBuffer(file);
		});
	}

	/**
	 * 200627，进行blob对象的浏览器端下载的封装。
	 * @param {blob} blob 待下载的blob对象。
	 * @param {string} fileName 下载时显示的文件名。为空，则为“name”。
	 */
	f_blobDownload = function(blob,fileName){
		var url,
			a;

		/* 参数获取、检查。 */
		if(f_isEmpty(blob)){
			return;
		}
		if(f_isEmpty(fileName)){
			fileName = "name";
		}

		/* 下载处理。 */
		// 创建下载链接对象。
		url = window.URL.createObjectURL(blob);
		a = document.createElement("a");
		a.style.display="none";
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		// 下载触发。
		a.click();
		// 下载后，删除当前链接、URL。
		setTimeout(function(){
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		},1000);
	}

	/** 函数类对象定义。*/
	BlobAgent = function(){};

	/** 当前模块的执行入口封装函数。*/
	f_main = function (){
		f_prototypeExtend("combine",f_blobCombine);
		f_prototypeExtend("sliceBySize",f_blobSliceBySize);
		f_prototypeExtend("getFromFileByBinary",f_getBlobFromFileByBinary);
		f_prototypeExtend("download",f_blobDownload);

		pptr[instanceName] = new BlobAgent();
	};

	f_prototypeExtend = function (n,v) {
		if(typeof(n)==="object"){
			for(var s in n){
				f_prototypeExtend(s,n[s]);
			}
		}else{
			BlobAgent.prototype[n] = v;
		}
	};
	f_gid = function (a) {
		return document.getElementById(a);
	};
	f_isEmpty = function (obj)
	{
		return obj===undefined || obj===null;
	};
	f_debug = function ()
	{
		for(var i=0,j=arguments.length;i<j;i++){
			if(typeof(arguments[i])=="string"){
				console.debug(v_logTag+" D:"+arguments[i]);
			}else{
				console.info(arguments[i]);
			}
		}
	};
	f_error = function(){
		for(var i=0,j=arguments.length;i<j;i++){
			if(typeof(arguments[i])=="string"){
				console.error(v_logTag+" E:"+arguments[i]);
			}else{
				console.info(arguments[i]);
			}
		}
	};

	f_main();
}(window,"bloba");