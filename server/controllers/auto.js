var MongoClient = require('mongodb').MongoClient;
var math = require('mathjs');
var index = require('./index');
var tool = require('./tool');

function auto_run() {

  if (tool.isWorkTime()) {
    // get new data from jsonp
    index.update();

    // update onObservation
    MongoClient.connect(dbpath, function(err, db) {
      var collection = db.collection('onObservation');

      collection.find({"ifsell": {"$eq": 0}}).toArray(function(err, docs) {
        var newdata = [];
        for (var i=0; i<docs.length; i++) {

          // 计算股票和沪深300涨幅
          code_up = math.round(math.eval((docs[i].codePriceEnd - docs[i].codePriceStart) / docs[i].codePriceStart * 100), 2);
          code_up_string = code_up.toString() + "%";

          sh300_up = math.round(math.eval((docs[i].sh300End - docs[i].sh300Start) / docs[i].sh300Start * 100), 2);
          sh300_up_string = sh300_up.toString() + "%";

          relative_up = math.round(math.eval(code_up - sh300_up), 2);
          relative_up_string = relative_up.toString();

          // 获取当前得日期 如2015-11-11
          date = new Date();
          Ymd = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

          // 求得持股天数
          sDate= docs[i].startDate;
          eDate= docs[i].ifsell === 1 ? docs[i].endDate : Ymd;
          sArr = sDate.split("-");
          eArr = eDate.split("-");
          sRDate = new Date(sArr[0], sArr[1], sArr[2]);
          eRDate = new Date(eArr[0], eArr[1], eArr[2]);
          hold_days = (eRDate-sRDate)/(24*60*60*1000);

          one = {
            "endDate": eDate,
            "code_up": parseFloat(code_up),
            "sh300_up": parseFloat(sh300_up),
            "code_up_string": code_up_string,
            "sh300_up_string": sh300_up_string,
            "relative_up": parseFloat(relative_up),
            "relative_up_string": relative_up_string,
            "hold_days": hold_days,
          }
          newdata.push(one);

          collection.updateOne({code: docs[i].code, author: docs[i].author, ifsell: 0}, {$set: one});
        }
        console.log("newdata generator success");
      });
    });
  } else {
    var tmpDate = new Date();
    console.log('['+tmpDate+']Not work time, Do not update');
  }
};


exports.start = function() {
  setInterval(auto_run, 15000);
}
