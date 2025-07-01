// functionality for editing albums.

function AlbumEditFeatures() {
	




	
};

async function _AsyncStartProcesses() {
	return new Promise(function(resolve, reject) {
		try {
			AlbumEditFeatures();
			console.log("done album edit features");

		} catch(err) {
			console.log("album edit features error " + err);
			reject(["failure", err]);
		};

		resolve(["success"]);		
	});
};

async function _ExpireAndReject() {
	return new Promise(function(_, reject) {
		setTimeout(() => reject(["TIMEOUT!"]), UMAX_EXECUTION_TIMEOUT);
	});
};

Promise.race([ // return fastest
	_AsyncStartProcesses(),
	_ExpireAndReject(),
]);