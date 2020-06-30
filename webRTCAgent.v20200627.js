/**
 * 200627，进行webRTC的video功能使用封装。
 * 依赖adapter.js，进行相关对象基本规则的整合。
 */
!function(pptr,instanceName){
	/** 全局变量的定义。 */
	var 
		VIDEO_CONFIG_NAME_OF_VIDEO_OBJECT = "video",	// videoConfig对象中，videoObject的属性名。

		SCENE_NAME_OF_VIDEO_EXAM = "ve",	// 视频考试的场景名称。

		MIME_TYPE_OF_VIDEO1 = "video/webm;codecs=vp9,opus",	// mime的类型常量1。
		MIME_TYPE_OF_VIDEO2 = "video/webm;codecs=vp8,opus",	// mime的类型常量2。
		MIME_TYPE_OF_VIDEO3 = "video/webm",	// mime类型的常量3。

		VIDEO_RECORD_STATE_OF_NOT_INIT = 0,	// 未初始化的状态。
		VIDEO_RECORD_STATE_OF_START = 1,	// 开始记录的状态。
		VIDEO_RECORD_STATE_OF_NOT_START = 2,	// 没有开始记录的状态。

		PROTOTYPE_CONFIG_NAME_OF_DEVICES_ID_OBJECT = "0",	// 对象中，devices的id对象保存的配置名。

		INSTANCE_CONFIG_NAME_OF_MEDIA_OUTPUT_CONFIG = "7",	// 实例中，媒体输出配置的配置名。
		INSTANCE_CONFIG_NAME_OF_VIDEO_OBJECT = "6",	// 实例中，video对象的配置名。
		INSTANCE_CONFIG_NAME_OF_VIDEO_RECORD_STATE = "5",	// 实例中，video记录的状态，从而，有开始、停止的状态切换。
		INSTANCE_CONFIG_NAME_OF_MEDIA_RECORDER_DATA_ARRAY="4",	// 实例中，mediaRecorder数据数组的配置名。
		INSTANCE_CONFIG_NAME_OF_MEDIA_RECORDER = "3",	// 实例中，mediaRecorder对象的配置名。
		INSTANCE_CONFIG_NAME_OF_SCENE = "2",	// 实例中，scene对象的配置名。
		INSTANCE_CONFIG_NAME_OF_USER_MEDIA_STREAM = "1",	// 实例配置中，videoRecordStream对象的配置名。
		INSTANCE_CONFIG_NAME_OF_CONSTRAINS = "0",	// 实例配置中，设备约束对象的配置名。

		v_propertyConfigAttributeName = "p",	// 对象配置的prototype成员的名称。
		v_instanceConfigAttributeName = "c",	// 实例配置对象的名称。
		v_logTag = ""	// 日志的Tag标签，根据需要进行组织。
		;

	/** 函数对象的定义。 */
	var WebRTCAgent,
		f_main,
		f_prototypeExtend,
		f_prototypeConfig,
		f_instanceConfig,
		f_gid,
		f_isEmpty,
		f_debug,
		f_error,


		f_getConstrains,
		f_setSceneOfVideoSimple,
		f_setSceneOfVideoExamination,
		f_setScene,
		f_getScene,
		f_videoInit,
		f_videoRecordStart,
		f_videoRecordStop,
		f_videoRecordIsStart,
		f_videoRecordIsInitOver,

		f_getUserMediaStream,
		f_getUserMediaStreamByConstrains,
		f_getVideoRecordState,
		f_setVideoRecordState,
		f_getMediaRecorder,
		f_setMediaRecorder,
		f_getMediaRecorderDataArray,

		f_getMediaRecorderByStreamAndOptions,
		f_getMediaRecorderByInstanceConfig,
		f_getMediaRecorderOptionsByInstanceScene,
		f_getMediaRecorderOptionsOfVideoSimple,

		f_getDevicesIdConfig,
		f_setDeviceIdConfig,

		f_getVideoObject,
		f_setVideoObject,
		f_getMediaOutputConfig,
		f_mediaObjectRefresh,

		f_detectCanUse;

	/**
	 * 200627，检查是否能使用的过程封装。
	 * @return {bool} true，支持相关功能；false，不支持相关功能。
	 * 
	 */
	f_detectCanUse = function(){
		if(f_isEmpty(navigator)){
			return false;
		}
		if(f_isEmpty(navigator.mediaDevices)){
			return false;
		}
		if(f_isEmpty(navigator.mediaDevices.getUserMedia)){
			return false;
		}

		return true;
	}

	/**
	 * 200627，进行video对象刷新的过程封装。主要是outputConfig的处理。
	 */
	f_mediaObjectRefresh = async function(){
		var instance,
			videoObject,
			outputConfig;

		/* 参数获取、检查。 */
		instance = this;
		videoObject = f_getVideoObject.call(instance);
		if(f_isEmpty(videoObject)){
			// 如果videoObject为空，不处理。
			return;
		}
		if(typeof videoObject.sinkId === 'undefined'){
			// 如果媒体对象不支持sinkId的配置，不进行处理。
			return;
		}
		outputConfig = f_getMediaOutputConfig.call(instance);
		if(f_isEmpty(outputConfig)){
			// 如果配置对象为空，不处理。
			return;
		}

		/* 输出对象的配置。 */
		try{
			await videoObject.setSinkId(outputConfig.audiooutput);
		}catch(error){
			f_error("video.setSinkId("+outputConfig.audiooutput+") error:",error,".");
		}
	}

	/**
	 * 200627，当前实例中，video对象的保存。
	 * @param {object} obj video对象。
	 */
	f_setVideoObject = function(obj){
		f_instanceConfig(this,INSTANCE_CONFIG_NAME_OF_VIDEO_OBJECT,obj);
	}

	/**
	 * 200627，当前实例中，video对象的获取。
	 */
	f_getVideoObject = function(){
		return f_instanceConfig(this,INSTANCE_CONFIG_NAME_OF_VIDEO_OBJECT);
	}

	/**
	 * 200627，进行媒体输出的配置对象。使用中，将直接修改此对象。
	 */
	f_getMediaOutputConfig = function(){
		var config,
			instance;

		instance = this;
		config = f_instanceConfig(instance,INSTANCE_CONFIG_NAME_OF_MEDIA_OUTPUT_CONFIG);
		if(f_isEmpty(config)){
			config = {};
			f_instanceConfig(instance,INSTANCE_CONFIG_NAME_OF_MEDIA_OUTPUT_CONFIG,config);
		}

		return config;
	}

	/**
	 * 200627，进行当前设备指定的封装。
	 * @param {object} idConfig 对象id的配置对象。
	 * @return {int} 处理过程是否有异常的状态。
	 * 0，没有异常。
	 * 1，idConfig为空。
	 */
	f_setDeviceIdConfig = function(idConfig){
		var instance,
			constrains,
			tmp;

		/* 参数获取、检查。 */
		instance = this;
		if(f_isEmpty(idConfig)){
			return 1;
		}

		/* 约束对象获取、配置。 */
		constrains = f_getConstrains.call(instance);
		if(!f_isEmpty(idConfig.audioinput)){
			if(f_isEmpty(constrains.audio) || typeof(constrains.audio)!="object"){
				constrains.audio={};
			}
			constrains.audio.deviceId = idConfig["audioinput"];
		}
		if(!f_isEmpty(idConfig.videoinput)){
			if(f_isEmpty(constrains.video) || typeof(constrains.videoinput)!="object"){
				constrains.video={};
			}
			constrains.video.deviceId = idConfig.videoinput;
		}
		if(!f_isEmpty(idConfig.audiooutput)){
			/* 对于音频输出的指定，由于依赖于页面对象，所以，先保存到配置中。后期进行功能对接。 */
			tmp = f_getMediaOutputConfig();
			tmp.audiooutput = idConfig.audiooutput;
		}

		f_debug("constrains is ",constrains,".");
	}

	/**
	 * 200627，获取当前平台的设备标识对象。
	 * 经过实际测试，进行此方法调用时，不会有权限的交互。
	 */
	f_getDevicesIdConfig = async function(){
		var devicesIdConfig,tmp;

		/* 数据获取 */
		devicesIdConfig = f_prototypeConfig(PROTOTYPE_CONFIG_NAME_OF_DEVICES_ID_OBJECT);
		if(f_isEmpty(devicesIdConfig)){
			/* 如果类中保存对象为空，进行获取。 */
			try{
				tmp = await navigator.mediaDevices.enumerateDevices();
			}catch(error){
				f_error("navigator.mediaDevices.enumerateDevices() error:",e,".");
				return null;
			}
			if(f_isEmpty(tmp)){
				f_error("enumerateDevices() returns null.");
				return null;
			}

			// 遍历设备对象，进行输出的封装。
			devicesIdConfig = {audioinput:[],audiooutput:[],videoinput:[]};
			for(var i=0,j=tmp.length;i<j;i++){
				switch(tmp[i].kind){
					case "audioinput":
						devicesIdConfig.audioinput.push(tmp[i].deviceId);
						break;
					case "audiooutput":
						devicesIdConfig.audiooutput.push(tmp[i].deviceId);
						break;
					case "videoinput":
						devicesIdConfig.videoinput.push(tmp[i].deviceId);
						break;
				}
			}

			// 结果对象保存。
			f_prototypeConfig(PROTOTYPE_CONFIG_NAME_OF_DEVICES_ID_OBJECT,devicesIdConfig);
		}
		
		return devicesIdConfig;
	}

	/**
	 * 200627，videoRecord状态配置的封装。
	 * @param {object} obj 状态对象。
	 */
	f_setVideoRecordState = function(obj){
		f_instanceConfig(this,INSTANCE_CONFIG_NAME_OF_VIDEO_RECORD_STATE,obj);
	}

	/**
	 * 200627，videoRecord的状态获取。
	 */
	f_getVideoRecordState = function(){
		var start;

		state = f_instanceConfig(this,INSTANCE_CONFIG_NAME_OF_VIDEO_RECORD_STATE);
		if(f_isEmpty(state))
			// 如果没有配置的话，表示未初始化。
			return VIDEO_RECORD_STATE_OF_NOT_INIT;

		return state;
	}

	/**
	 * 200627，获取mediaRecorder数据对象数组的封装。
	 * 实际使用时，在“f_videoRecordStop”调用后最好能有一定的延时，否则，对象可能会在获取后变动。
	 */
	f_getMediaRecorderDataArray = function(){
		var instance,array;

		/* 参数获取 */
		instance = this;
		array = f_instanceConfig(instance,INSTANCE_CONFIG_NAME_OF_MEDIA_RECORDER_DATA_ARRAY)
		if(f_isEmpty(array)){
			/* 如果array为空，则创建新的array并保存。 */
			array = [];
			f_instanceConfig(instance,INSTANCE_CONFIG_NAME_OF_MEDIA_RECORDER_DATA_ARRAY,array);
		}

		/* 返回对象。 */
		return array;
	}

	/**
	 * 200627，mediaRecorder实例获取的封装。
	 */
	f_getMediaRecorder = function(){
		return f_instanceConfig(this,INSTANCE_CONFIG_NAME_OF_MEDIA_RECORDER);
	}

	/**
	 * 200627，mediaRecorder实例配置的封装。
	 * @param {object} obj MediaRecorder的实例。
	 */
	f_setMediaRecorder = function(obj){
		f_instanceConfig(this,INSTANCE_CONFIG_NAME_OF_MEDIA_RECORDER,obj);
	}

	/**
	 * 200627，进行视频录制的简单配置返回。
	 */
	f_getMediaRecorderOptionsOfVideoSimple = function(){
		var options;

		options = {};
		if(MediaRecorder.isTypeSupported(MIME_TYPE_OF_VIDEO1)){
			options.mimeType = MIME_TYPE_OF_VIDEO1;
		}else if(MediaRecorder.isTypeSupported(MIME_TYPE_OF_VIDEO2)){
			options.mimeType = MIME_TYPE_OF_VIDEO2;
		}else if(MediaRecorder.isTypeSupported(MIME_TYPE_OF_VIDEO3)){
			options.mimeType = MIME_TYPE_OF_VIDEO3;
		}

		return options;
	}

	/**
	 * 200627，根据当前实例的场景，进行mediaRecorder配置生成的封装。
	 */
	f_getMediaRecorderOptionsByInstanceScene = function(){
		var instance;

		instance = this;

		return f_getMediaRecorderOptionsOfVideoSimple();
	}

	/**
	 * 200627，根据当前类实例的配置，针对视频录像，获取mediaRecorder对象的封装。
	 */
	f_getMediaRecorderByInstanceConfig = function(){
		var instance,stream,options,scene;

		instance = this;
		stream = f_getUserMediaStream.call(instance);
		options = f_getMediaRecorderOptionsByInstanceScene.call(instance);

		return f_getMediaRecorderByStreamAndOptions(stream,options);
	}

	/**
	 * 200627，根据userMediaStream、options进行MediaRecorder对象构建的封装。
	 * @param stream js的流对象。
	 * @param options mediaRecorder的配置属性，如mime属性声明等。
	 */
	f_getMediaRecorderByStreamAndOptions = function(stream,options){
		var mediaRecorder;

		try{
			mediaRecorder = new MediaRecorder(stream, options);
		}catch(error){
			f_error("Make MediaRecorder(.,",options,") error:",error,".");
			return null;
		}

		return mediaRecorder;
	}

	/**
	 * 200627，视频录像操作结束的方法。
	 */
	f_videoRecordStop = function(){
		var instance,mediaRecorder;

		/* 参数获取 */
		instance = this;
		mediaRecorder = f_getMediaRecorder.call(instance);
		if(f_isEmpty(mediaRecorder)){
			f_debug("mediaRecorder is empty,to return.");
			return;
		}

		mediaRecorder.stop();
	}

	/**
	 * 200627，videoRecord是否初始化完成的状态。
	 */
	f_videoRecordIsInitOver = function(){
		var instance;

		instance = this;

		return f_getVideoRecordState.call(instance) != VIDEO_RECORD_STATE_OF_NOT_INIT;
	}

	/**
	 * 200627，videoRecord是否开始的状态。
	 */
	f_videoRecordIsStart = function(){
		var instance;

		instance = this;

		return f_getVideoRecordState.call(instance) == VIDEO_RECORD_STATE_OF_START;
	}

	/**
	 * 200627，video录像功能开始的封装函数。
	 * @param config 配置对象，可为空。
	 * @return {int} 开始过程是否有异常的状态。
	 * 0，没有异常。
	 * 101，当前设备未初始化。
	 * 102，当前正在录制过程。
	 * 103，mediaRecorder对象创建失败。
	 */
	f_videoRecordStart = function(config){
		var instance,
			mediaRecorder,
			mediaRecordDataArray;

		/* 参数获取。 */
		instance = this;

		if(!f_videoRecordIsInitOver.call(instance)){
			return 101;
		}
		if(f_videoRecordIsStart.call(instance)){
			// 正在录制中，则不能再次录制。
			return 102;
		}

		/* 创建mediaRecorder对象。 */
		mediaRecorder = f_getMediaRecorderByInstanceConfig.call(instance);
		if(f_isEmpty(mediaRecorder)){
			return 103;
		}
		f_setMediaRecorder.call(instance,mediaRecorder);

		/* mediaRecorder对象的配置。 */
		mediaRecordDataArray = f_getMediaRecorderDataArray.call(instance);
		// 事件函数需要在使用前进行声明，才可以。
		mediaRecorder.ondataavailable = function(event){
			if(event.data && event.data.size>0){
				/* 如果事件非空，则进行视频数据的追加记录。 */
				mediaRecordDataArray.push(event.data);
			}
		};
		mediaRecorder.onstop = function(event){
			f_setVideoRecordState.call(instance,VIDEO_RECORD_STATE_OF_NOT_START);
		};

		/* mediaRecorder的启动。 */
		mediaRecorder.start();
		f_setVideoRecordState.call(instance,VIDEO_RECORD_STATE_OF_START);
	}

	/**
	 * 200627，视频考试下，constrains约束的配置。
	 * 参考“xx20”《WebRTC本地媒体——约束详解 （2020-06-26 18:31:12.818）》进行配置。
	 */
	f_setSceneOfVideoExamination = function(){
		var instance,constrains;
		/* 参数获取 */
		instance = this;
		constrains = f_getConstrains.call(instance);

		/* 配置组合。 */
		constrains.video = true;
		constrains.audio = true;
		// 宽度在320~1920之间
		if(f_isEmpty(constrains.width)){
			constrains.width = {};
		}
		constrains.width.min = 320;
		constrains.width.max = 1920;
		// 高度在240~1080之间
		if(f_isEmpty(constrains.height)){
			constrains.height = {};
		}
		constrains.height.min = 240;
		constrains.height.max = 1080;
		// 视频分辨率：1280*720。
		constrains.width.ideal = 1280;
		constrains.height.ideal = 720;
		if(f_isEmpty(constrains.video)){
			constrains.video={};
		}
		if(f_isEmpty(constrains.video.facingMode)){
			constrains.video.facingMode = {};
		}
		constrains.video.facingMode="environment";
		// constrains.video.facingMode.exact = "environment";
	}

	/**
	 * 200627，简单场景下，constrains约束的配置。
	 */
	f_setSceneOfVideoSimple = function(){
		var instance,constrains;

		instance = this;
		constrains = f_getConstrains.call(instance);
		constrains.video = true;
		constrains.audio = true;
	}

	/**
	 * 200627，设置场景的封装方法。
	 */
	f_setScene = function(sceneName){
		var instance;

		/* 参数获取 */
		instance = this;
		// 保存场景到当前实例，以供其他环节使用。
		f_instanceConfig(instance,INSTANCE_CONFIG_NAME_OF_SCENE,sceneName);

		/* 场景的判断、处理。 */
		switch(sceneName){
			case SCENE_NAME_OF_VIDEO_EXAM:
				f_setSceneOfVideoExamination.call(instance);
				break;
			default:
				f_setSceneOfVideoSimple.call(instance);
				break;
		}


	}

	/**
	 * 200627，获取当前实例中的场景。
	 */
	f_getScene = function(){
		return f_instanceConfig(this,INSTANCE_CONFIG_NAME_OF_SCENE);
	}

	/**
	 * 200627，实例中，videoRecordStream对象获取的封装。
	 * @return {object} 对象实例。
	 */
	f_getUserMediaStream = function(){
		return f_prototypeConfig(INSTANCE_CONFIG_NAME_OF_USER_MEDIA_STREAM);
	}

	/**
	 * 200627，实例中，通过constrains约束对象，获取videoRecordStream对象的封装。
	 * 每次都会根据constrains重新创建，从而，起到刷新对象的作用。
	 * 实际使用中，进行此函数调用时，会有权限的交互。
	 * 
	 * @param {object} constrains 流对象创建时的约束对象。
	 */
	f_getUserMediaStreamByConstrains = async function(constrains){
		var instance,
			userMediaStream,
			tmp,i,j;
		
		/* 参数获取 */
		instance = this;
		if(f_isEmpty(constrains)){
			return null;
		}

		/* stream对象存在时，关闭。*/
		userMediaStream = f_getUserMediaStream.call(instance);
		if(!f_isEmpty(userMediaStream)){
			// 如果存在已有的stream对象，进行track对象的停止。
			tmp = userMediaStream.getTracks();
			for(i=0,j=tmp.length;i<j;i++){
				tmp[i].stop();
			}
		}
		userMediaStream = null;

		/* 如果实例中的userMediaStream对象为空，则进行创建。 */
		try{
			// 以同步方式，进行getUserMedia的调用。
			userMediaStream = await navigator.mediaDevices.getUserMedia(constrains);
		}catch(error){
			f_error("..getUserMedia(",constrains,").then(.) error.",error);
			return null;
		}
		if(f_isEmpty(userMediaStream)){
			f_error("userMediaStream is empty.");
			return null;
		}
		// stream对象，保存到实例中，后期会用到。
		f_prototypeConfig(INSTANCE_CONFIG_NAME_OF_USER_MEDIA_STREAM,userMediaStream);

		return userMediaStream;
	}

	/**
	 * 200627，视频记录的初始化过程封装。进行设备的启动、video对象的关联。
	 * 经过测试，可多次执行，
	 * @param {object} 配置对象。
	 * @return int 处理过程是否有异常的状态。
	 * 0，没有异常；
	 * 1，config为空。
	 * 2，config[VIDEO_CONFIG_NAME_OF_VIDEO_OBJECT]为空。
	 * 3，所依赖的constrains对象为空。
	 * 101，userMediaStream为空。
	 */
	f_videoInit = async function(config){
		var instance,
			userMediaStream,
			videoObject,
			constrains,
			videoRecordStream,
			videoRecordStreamTracks;

		/* 参数获取、检查。 */
		// 实例的获取。
		instance = this;
		// 配置对象检查。
		if(f_isEmpty(config)){
			return 1;
		}
		videoObject = config[VIDEO_CONFIG_NAME_OF_VIDEO_OBJECT];
		if(f_isEmpty(videoObject)){
			return 2;
		}
		// 约束对象的检查。
		constrains = f_getConstrains.call(instance);
		if(f_isEmpty(constrains)){
			return 3;
		}

		var tmp;
		tmp = document.createElement("div");
		tmp.innerText = JSON.stringify(constrains);
		document.body.appendChild(tmp);

		// 设备流对象获取。
		userMediaStream = await f_getUserMediaStreamByConstrains(constrains);
		if(f_isEmpty(userMediaStream)){
			return 101;
		}

		/* 设备的启动，同时，关联到video对象上，以进行显示。 */
		videoObject.srcObject = userMediaStream;
		// 状态转变为未启动。
		f_setVideoRecordState.call(instance,VIDEO_RECORD_STATE_OF_NOT_START);

		return 0;
	}

	/**
	 * 200627，当前实例中，constrains约束对象的获取。
	 * 提供给实例内、外使用。
	 */
	f_getConstrains = function(){
		var instance,constrains;

		instance = this;

		// 获取实例中的对象。
		constrains = f_instanceConfig(instance,INSTANCE_CONFIG_NAME_OF_CONSTRAINS);
		if(f_isEmpty(constrains)){
			// 如果当前实例中的配置为空，则进行创建。
			constrains = {};
			f_instanceConfig(instance,INSTANCE_CONFIG_NAME_OF_CONSTRAINS,constrains);
		}

		return constrains;
	}


	/** 函数类对象定义。*/
	WebRTCAgent = function(){};

	/** 当前模块的执行入口封装函数。*/
	f_main = function (){

		f_prototypeExtend("canUse",f_detectCanUse);
		f_prototypeExtend("scene",f_setScene);
		f_prototypeExtend("videoInit",f_videoInit);
		f_prototypeExtend("videoRecordStart",f_videoRecordStart);
		f_prototypeExtend("videoRecordIsStart",f_videoRecordIsStart);
		f_prototypeExtend("videoRecordIsInitOver",f_videoRecordIsInitOver);
		f_prototypeExtend("videoRecordStop",f_videoRecordStop);
		f_prototypeExtend("getDataArray",f_getMediaRecorderDataArray);

		f_prototypeExtend("setDeviceIdConfig",f_setDeviceIdConfig);
		f_prototypeExtend("getDevicesIdConfig",f_getDevicesIdConfig);

		/* 以多实例方式，提供外部使用。 */
		pptr[instanceName] = WebRTCAgent;
	};

	f_instanceConfig = function (instance,n,v) {
		if (instance[v_instanceConfigAttributeName] == null) {
			instance[v_instanceConfigAttributeName] = {};
		}
		if (v == undefined)
			return instance[v_instanceConfigAttributeName][n];
		else
			instance[v_instanceConfigAttributeName][n] = v;
		return instance;
	};
	f_prototypeConfig = function (n,v){
		if(n===null || n===undefined){
			return;
		}
		var prototypeObj=WebRTCAgent.prototype;
		if(prototypeObj[v_propertyConfigAttributeName]===null || prototypeObj[v_propertyConfigAttributeName]===undefined){
			prototypeObj[v_propertyConfigAttributeName]={};
		}
		if(typeof(n)==="object"){
			for(var s in n){
				f_prototypeConfig(s,n[s]);
			}
		}else if(v===undefined){
			return prototypeObj[v_propertyConfigAttributeName][n];
		}else{
			prototypeObj[v_propertyConfigAttributeName][n]=v;
		}
	};
	f_prototypeExtend = function (n,v) {
		if(typeof(n)==="object"){
			for(var s in n){
				f_prototypeExtend(s,n[s]);
			}
		}else{
			WebRTCAgent.prototype[n] = v;
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
}(window,"rtca");
