const express = require('express');
const sequelize = require('sequelize');
const router = express.Router();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const path = require('path');
const request = require('request');

var connection;

if(process.env.JAWSDB_URL){

    //Heroku
  connection = new sequelize(process.env.JAWSDB_URL, {
  
    dialect : 'mysql',
  
    define : {
  
       freezeTableName : true,
       timestamps : false
    }
  
  })
  
  }
  
  else{
  
  connection = new sequelize("decoaries", "root", "password", {
  
    dialect : 'mysql',
  
    define : {
  
       freezeTableName : true,
       timestamps : false
    }
  
  })
  
  }

  // Authentication middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and 
  // the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://decoaries.auth0.com/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: 'https://decoaries.auth0.com/api/v2/',
  issuer: `https://decoaries.auth0.com/`,
  algorithms: ['RS256']
});

  var User= connection.import('../models/User');
  var Client = connection.import('../models/Client');
  var Company = connection.import('../models/Company');
  var Product = connection.import('../models/Product');
  var Order = connection.import('../models/Order');
  var OrderDetails = connection.import('../models/OrderDetails');
  var Phone = connection.import('../models/Phone');
  function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}

router.post('/api/register-client',checkJwt, function(req, res){
    let phones = [];
    phones = req.body.phones

    //If the company is not in DB, create it//
    if(!req.body.exists){
      //Create Company//
      let guid1 = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
     Company.create({
      idCompany : guid1,
      Name : req.body.companyName,
      Website : req.body.companyWebsite,
      From : 'Web App',
      idUser : req.body.idUser
    }).then(company =>{
      //Store ID of created company//
      idCompany = company.dataValues.idCompany
      //Create Client//
      let guid2 = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
      connection.query("Insert into client (idClient, Name, Email, Gender, Status, createDate, idCompany, idUser) values ('"+guid2+"', '"+req.body.name+"', '"+req.body.email+"', '"+req.body.gender+"', 'Active', '"+req.body.date+"', '"+guid1+"', '"+req.body.idUser+"')")
      .then(client=>{
        phones.forEach(value=>{
          let guid3 = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
          Phone.create({
            idPhone : guid3,
            PhoneNumber : value,
            idClient : guid2
          }).catch(err=>{
            console.log(err)
            return res.json({error : true, msg: err});
          })
        })

        return res.json({success : true});
      
      })
    }).catch(e=>{
      console.log(e)
      return res.json({error : true, msg : e});
    })
  } 
  //If the company is already stored in DB, find and store it's ID//
  else{
    Company.find({
      where : {
        Name : req.body.companyName
      }
    }).then(company =>{
      let guid2 = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
      //Create client//
      connection.query("Insert into client (idClient, Name, Email, Gender, Status, createDate, idCompany, idUser) values ('"+guid2+"', '"+req.body.name+"', '"+req.body.email+"', '"+req.body.gender+"', 'Active', '"+req.body.date+"', '"+company.idCompany+"', '"+req.body.idUser+"')")
      .then(client=>{
        phones.forEach(value=>{
          let guid3 = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
          Phone.create({
            idPhone : guid3,
            PhoneNumber : value,
            idClient : guid2
          }).catch(err=>{
            console.log(err)
            return res.json({error : true, msg: err});
          })
        })

        return res.json({success : true});

      }).catch(e=>{
        console.log(e);
      res.json({success : false})
      })
    })
  }

    

    


    
  


});

router.get('/api/get-companies', function(req, res){

    Company.findAll().then(json=>{
      res.send(json);
    }).catch(e=>{
      console.log(e);
    res.json({success :false});
    })

});

router.get('/api/get-companies2', function(req, res){
  connection.query("select company.idCompany, company.Name as 'Company', company.Website, company.From, user.Name as 'createdBy' from company inner join user on company.idUser = user.idUser").then(json=>{
    res.send(json)
  }).catch(e=>{
    console.log(e)
    res.json({success : false, msg: "Something went wrong"});
  })
})

router.get('/api/get-clients', function(req,res){
  connection.query("select client.idClient, client.Name, client.Gender, client.Email, client.Status, client.createDate, company.Name as 'Company', company.Website, user.Name as 'createdBy' from client inner join company on client.idCompany = company.idCompany inner join user on client.idUser = user.idUser")
  .then(data=>{
    res.send(data)
  }).catch(e=>{
    console.log(e)
    res.json({success :false})
  })
});

router.post('/api/update-client', checkJwt,function(req, res){
  let phones = [];
  phones = req.body.phones;
  if(!req.body.exists){
    let guid1 = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
    Company.create({
      idCompany : guid1,
      Name : req.body.companyName,
      Website : req.body.companyWebsite,
      From : 'Web App',
      idUser : req.body.idUser
    }).then(company=>{
      Client.update({
        Name : req.body.name,
        Email : req.body.email,
        Gender : req.body.gender,
        idCompany : guid1,
        idUser : req.body.idUser
  },{ where : {
    idClient : req.body.idClient
  }}).then(client=>{
    Phone.destroy({
      where : {
        idClient : req.body.idClient
      }
    }).then(destroyed=>{
      phones.forEach(value=>{
        let guid2= (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
        Phone.create({
        idPhone : guid2,
        PhoneNumber : value,
        idClient : req.body.idClient
        }).catch(err=>{
          return res.json({success : false, msg : err})
        })
      })
      return res.json({success : true, msg : 'Client info updated'})
    })
  }).catch(e=>{
    console.log(e)
    res.json({success : false, msg: "Something went wrong"});
  })

    }).catch(e=>{
      console.log(e)
    res.json({success : false, msg: "Something went wrong"});
    })
  }

  else{
    Company.find({
      where : {
        Name : req.body.companyName
      }
    }).then(company=>{
      Client.update({
        Name : req.body.name,
        Email : req.body.email,
        Gender : req.body.gender,
        Status : req.body.status,
        idCompany : company.dataValues.idCompany,
        idUser : req.body.idUser
      }, {
        where : {
          idClient : req.body.idClient
        }
      }).then(client=>{
        Phone.destroy({
          where : {
            idClient : req.body.idClient
          }
        }).then(destroyed=>{
          phones.forEach(value=>{
            let guid2= (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
          Phone.create({
            idPhone : guid2,
            PhoneNumber : value,
            idClient : req.body.idClient
          }).catch(err=>{
            return res.json({success :false, msg : err})
          })
          })
          return res.json({success : true, msg : 'Updated client info'})
        })
      }).catch(e=>{
        console.log(e)
        res.json({success : false, msg : "Something went wrong"})
      })
    })
  }


  
});

router.post('/api/update-company', checkJwt, function(req,res){
Company.update({
  CompanyName : req.body.name,
  Website : req.body.website
}, {
  where : {
    idCompany : req.body.idCompany
  }
}).then(company=>{
  res.json({success :true, msg : "Company info updated"})
}).catch(e=>{
  console.log(e)
  res.json({success : false, msg : "Something went wrong"})
})
});

router.get('/api/get-products', function(req, res){
  Product.findAll().then(json=>{
    res.send(json);
  }).catch(e=>{
    console.log(e)
    res.json({success : false, msg : "Something went wrong"})
  })
});

router.post('/api/add-order', checkJwt, function(req,res){
  let guid2= (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
  let auxArray = [];
  auxArray = req.body.orderProducts;
  Order.create({
    idOrder : guid2,
    idClient : req.body.idClient,
    OrderDate : req.body.orderDate,
    Price : req.body.price,
    Status : req.body.status,
    Observations :  req.body.observations
  }).then(order=>{
    auxArray.forEach(value=>{
      let guid3= (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();

      OrderDetails.create({
        idOrderDetail : guid3,
        idOrder : guid2,
        idProduct : value.idProduct,
        Quantity : value.Quantity,
      })
    })
  }).then(finish=>{
    res.json({success :true, msg : "Order created"})
  }).catch(e=>{
    console.log(e)
    res.json({success : false, msg : "Something went wrong"})
  })
});

router.get('/api/get-orders', function(req, res){

  connection.query("select client.idClient, client.Name as 'Client', client.Email, client.idCompany , company.Name as 'Company', orders.idOrder, orders.OrderDate as 'Date', orders.Price, orders.Status, orders.Observations from client inner join company on client.idCompany = company.idCompany inner join orders on orders.idClient = client.idClient")
  .then(json=>{
    res.send(json)
  }).catch(e=>{
    console.log(e)
    res.json({success : false, msg : "Something went wrong"});
  })


})

router.post('/api/get-order-details', checkJwt, function(req,res){
  connection.query("select orderdetails.Quantity, product.Name as 'Product' from orders inner join orderdetails on orders.idOrder= orderdetails.idOrder inner join product on orderdetails.idProduct = product.idProduct where orders.idOrder = '"+req.body.idOrder+"'")
  .then(json=>{
    res.send(json)
  }).catch(e=>{
    console.log(e)
    res.json({success :false, msg : "Something went wrong"})
  })
});

router.post('/api/update-order', checkJwt, function(req,res){
  let auxArray = [];
  auxArray=req.body.orderProducts;
  Order.update({
    Price : req.body.price,
    Status : req.body.status,
    Observations : req.body.observations
  }, {
    where : {
      idOrder : req.body.idOrder
    }
  }).then(order=>{
    OrderDetails.destroy({
      where : {
        idOrder : req.body.idOrder
      }
    }).then(destroyed=>{
      auxArray.forEach(value=>{
        let guid2= (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
        OrderDetails.create({
          idOrderDetail : guid2,
          idOrder : req.body.idOrder,
          idProduct : value.idProduct,
          Quantity : value.Quantity
        })
      })
    }).then(finish=>{
      res.json({success : true, msg : "Order info updated"})
    }).catch(e=>{
      console.log(e)
      res.json({success : false, msg : "Something went wrong"});
    })
  })
});

router.post('/api/add-product',checkJwt, function(req,res){
  let guid2= (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();

  Product.create({
    idProduct : guid2,
    Name : req.body.name,
    Description : req.body.description,
    Size : req.body.size,
    ClothType : req.body.cloth,
    URL : req.body.url
  }).then(product=>{
    res.json({success :true, msg : "Product added to database"})
  }).catch(e=>{
    console.log(e)
    res.json({success :false, msg : "Something went wrong"});
  })
});

router.post('/api/update-product', checkJwt, function(req, res){
  Product.update({
    Name : req.body.name,
    Description : req.body.description,
    Size : req.body.size,
    ClothType : req.body.cloth,
    URL : req.body.url
  }, {
    where : {
      idProduct : req.body.idProduct
    }
  }).then(product=>{
    res.json({success :true, msg : "Product info updated"});
  }).catch(e=>{
    console.log(e)
    res.json({success :false, msg : "Something sent wrong"});
  })
});

router.post('/api/clients-company', checkJwt, function(req,res){
  Client.findAll({
    where : {
      idCompany : req.body.idCompany
    }
  }).then(clients=>{
    res.send(clients)
  }).catch(e=>{
    console.log(e)
    res.json({success : false, msg : "Something went wrong"});
  })
});

router.post('/api/login', function(req, res){
let userToken;
let user;
let options1 = {
  url : 'https://decoaries.auth0.com/oauth/token',
  method : 'POST',
  headers: {
    'Content-Type' : 'application/json',
    'Authorization' : 'Bearer '+req.body.clientToken
  },
  form : {
    grant_type : 'password',
    client_id : 'phpxbP6A0vfUur3isYoKi8E6dicA33IM',
    client_secret : 'A5_dh9O8vxfIeeRupZXl6GafwsDbjpuoT2XXKPi6brSR5p_YN6BAb4Chev7TZ6Rh',
     audience : 'https://decoaries.auth0.com/api/v2/',
     username : req.body.email,
     password : req.body.password,
     scope : 'openid'
  }
}
request(options1, function(err, resp, body){
  if(err){
    console.log(err)
    return res.json({error : true, msg : 'Something went wrong'});
  }
  else {
  
 let json = JSON.parse(body);
 if(json.error){
   return res.json({error : true, msg : json.error_description})
 }
  userToken = json.access_token;
  
  User.findOne({
    where : {
      Email : req.body.email
    }
  }).then(user=>{
    return res.json({userToken : userToken, user : user.dataValues});
  }).catch(e=>{
    console.log(e)
    return res.json({error : true, msg : e});
  })
  
  }
 
})

});


router.post('/api/signup', checkJwt, function(req, res){
  console.log(req.body.date);
  let options = {
    url : 'https://decoaries.auth0.com/api/v2/users',
    method : 'POST',
    headers : {
      'Authorization' : 'Bearer '+req.body.clientToken
    },
    form : {
      connection : 'Username-Password-Authentication',
      email : req.body.email,
      password : req.body.password,
      name : req.body.name,
      verify_email : true
    }
  }

  request(options, function(err, resp, body){
    if(err){
      return res.json({error: true, msg : "Something went wrong"})
    }

    let json = JSON.parse(body);
    if(json.error){
      return res.json({error : true, msg : json.message})
    }

    else{
      let guid = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
      connection.query("Insert into user (idUser, Name, Email, createDate, Type) values ('"+guid+"', '"+req.body.name+"', '"+req.body.email+"', '"+req.body.date+"', '"+req.body.type+"')")
      .then(user=>{
        return res.json({error : false})
      }).catch(e=>{
        console.log(e)
        return res.json({error : true, msg: e});
      })
    }
    

  })

});

router.post('/api/get-phones', checkJwt, function(req, res){

Phone.findAll({
  where : {
    idClient : req.body.idClient
  }
}).then(phones=>{
  res.send(phones)
}).catch(err=>{
  console.log(err)
  res.json({success : false});
})


});

router.get('/api/get-users', checkJwt, function(req,res){
  User.findAll().then(users=>{
    return res.send(users)
  }).catch(e=>{
   return res.json({error : true, msg : e});
  })
});

router.post('/api/update-user',checkJwt, function(req,res){
  User.update({
    Name : req.body.name,
    Email : req.body.email,
    Type : req.body.type
  }, {
    where : {
      idUser : req.body.idUser
    }
  }).then(user=>{
    return res.json({success : true, msg :'User info updated'})
  }).catch(err=>{
    return res.json({success : false, msg :err});
  })
})


module.exports = router;