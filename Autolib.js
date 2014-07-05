/*************************
  SARAH-Plugin-Autolib
  Author: Alban Vidal-Naquet
  Date: 05/07/2014
  Description:
    Autolib Plugin for SARAH project (see http://encausse.wordpress.com/s-a-r-a-h/)
	
**************************/

/*****************************
  TODO LIST:
    -
******************************/

var g_debug=0;
var loc=require("./customloc.js").init(__dirname);
var bf=require("./basicfunctions.js");

var autolib_url="https://www.autolib.eu/stations/";

var parseResponse=function(arg, body, data, callback, config, SARAH)
{
	var regexp=new RegExp("=[ \t]*initMap[(](.*), {", 'i');
	var res=regexp.exec(body);
	var content="{\n\"list\":\n" + res[1] + "\n}";
	var autolib_park = JSON.parse(content);
	var starr=new Array();
	var starr2=new Array();
	var text="";
	starr=config.stations.split(",");
	for (var j in starr)
	  starr2[j]=parseInt(starr[j]);
	for (var i in autolib_park.list)
	{
	  if (data.type=="list")
	  {
		var fs=require('fs');
		var file=__dirname+"/Autolib_stationlist.txt"
		text+=autolib_park.list[i].station_id+"   "+autolib_park.list[i].address+"   "+autolib_park.list[i].name+"\r\n";
		fs.writeFileSync(file, text, 'utf8');
	  }
	  else if (starr2.indexOf(parseInt(autolib_park.list[i].station_id))!=-1)
	  {
		var id="";
		
		//console.log(autolib_park.list[i]); 
		var station=autolib_park.list[i].name.replace(new RegExp("/", 'g'), " ");
		var re=new RegExp("([^0-9]*) ([0-9]*)", 'i');
		var name=re.exec(station);
		loc.addDictEntry("STATION", name[1]);
		if (autolib_park.list[i].rental_status!="operational")
			id="STATIONKO";
		if (id=="")
			switch(data.type)
			{
				case "get":
					loc.addDictEntry("NUMBER", autolib_park.list[i].cars);
					if (autolib_park.list[i].cars>0)
						id="CARLEFT";
					else
						id="NOCARLEFT";
					break;
				case "park":
					loc.addDictEntry("NUMBER", autolib_park.list[i].parks);
					if (autolib_park.list[i].parks>0)
						id="PARKLEFT";
					else
						id="NOPARKLEFT";
					break;
			}
		if (id!="")
			SARAH.speak(loc.getLocalString(id));
	  }
	}
}

exports.init = function(SARAH)
{
	var config=SARAH.ConfigManager.getConfig();
	config=config.modules.Autolib;
	var data={};
	data.type="list";
	bf.sendRequest(autolib_url, parseResponse, 0, data, function(){}, config, SARAH);
}


exports.release = function(SARAH)
{
   loc.release();
}

var action = function(data, callback, config, SARAH)
{
	var config=config.modules.Autolib;
	if ((g_debug&2)!=0)
		console.log(data);
	switch(data.type)
	{
		case "park":
		case "get":
			SARAH.speak(loc.getLocalString("OKLETSGO"));
			bf.sendRequest(autolib_url, parseResponse, 0, data, callback, config, SARAH);
			break;
		default:
			SARAH.speak(loc.getLocalString("UNKNOWCMD"));
			break;
	}
	callback({'tts': ''});
	return 0;
}

exports.action=action;


