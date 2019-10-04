const express = require('express');
const firebase = require('firebase')
const bodyParser = require('body-parser')
const app = express()
const requestIp = require('request-ip');

app.set('view engine','ejs');

const urlEncodedParser = bodyParser.urlencoded({ extended: true })
const port = process.env.PORT || 2500;

var firebaseConfig = {
    
};
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);
var database = firebase.database();
 
// database.ref('test').once('value').then(function(snapshot){
//     console.log('yes');
//     console.log(snapshot.val());
// });

async function getIpData(ip){
    const data = await fetch('http://ip-api.com/json/'+ip);
    return data.json();
}

app.get('/404',function(request,response){
    return response.render('404');
})

app.get('/500',function(request,response){
    return response.render('500');
})

app.post('/generate',urlEncodedParser,function(request,response){
    var url = request.body.url;
    if(url==null || url=='')
        return response.redirect('/404');
    
    let data = {
        url:url,
        ips:[]
    }

    let refId = Date.now();
    database.ref(refId).set(data,function(err){
        if(err)
            return response.redirect('/500');
        else
            return response.redirect('/fetch/'+refId);
    });
});

app.get('/details/:ip',function(request,response){
    let ip = request.params.ip;
    let ipData = getIpData(ip);
    ipData.then(function(details){
        console.log(details);
        return response.render('details',{data:details});
    })
    .catch(error => response.redirect('/500'));
    
});

app.get('/:uid',function(request,response){
    var id = request.params.uid;
    database.ref(id).once('value').then(function(snapshot){
        var data = snapshot.val();
        if(data==null)
            return response.redirect('/404');
        let date = new Date();

        var timeStamp = date.getUTCDate()+'/'
        +(date.getUTCMonth()+1)+'/'
        +date.getUTCFullYear()
        +'  '+date.getUTCHours()
        +':'+date.getUTCMinutes()
        +':'+date.getUTCSeconds()+'  UTC';

        let userIp = requestIp.getClientIp(request);
        //console.log(requestIp.getClientIp(request));
        if(data.ips)
            data.ips.push({time:timeStamp,ip:userIp});
        else
            data.ips = [{time:timeStamp,ip:userIp}];

        // console.log('id '+id);
        // console.log(data);

        database.ref(id).set(data,function(error){
            if(error){
                console.log(error);
                return response.redirect('/500');
            }
            else
                return response.redirect(data.url);
        });
    });
})

app.get('/fetch/:uid',function(request,response){
    var id = request.params.uid;
    console.log(id);
    database.ref(id).once('value').then(function(snapshot){
        console.log('yes');
        let record = snapshot.val();
        return response.render('fetch',{data:record,sharelink:'https://ipgrabber.herokuapp.com/'+id});
    })
    .catch(function(err){
        return response.redirect('/404');
    });
    
});

app.get('/',function(request,response){
    return response.render('home');
});

app.get('*',function(request,response){
    return response.redirect('/404');
});

app.listen(port);