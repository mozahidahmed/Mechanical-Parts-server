const express=require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app =express();
const stripe=require('stripe')(process.env.STRPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port=process.env.PORT || 5000;





//middleware
app.use(cors());
app.use(express.json());

//......................................................

///kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk







  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ro517.mongodb.net/?retryWrites=true&w=majority`;

 const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//..............................................
function verifyJWT(req,res,next){
  console.log('abc')
  const authHeaders=req.headers.authorization;
  if(!authHeaders){
    return res.status(401).send({message:'UnAuthorize access'});
  
  }
  const token=authHeaders.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded) {
    
   if(err){
     return res.status(403).send({message: 'Forbidden access'})
   }
req.decoded=decoded;
next();
  });
}
//..............................................






async function run(){


 //.................................................................... 

 //.................................................................... 

try{
  await client.connect();
   const serviceCollection=client.db('mecanick-parse').collection('service');
   const reviewsCollection=client.db('mecanick-parse').collection('reviews');
   const userCollection=client.db('mecanick-parse').collection('user');
   const orderCollection=client.db('mecanick-parse').collection('order');
   const paymentCollection=client.db('mecanick-parse').collection('payment');
  

   
//PAYMENT...................................................................
app.post("/create-payment-intent", async (req, res) => {

  const service=req.body;
  const price=service.price;
  const amount =price*100;
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount:amount,
      currency:'usd',
      payment_method_types:['card']
  
    });
    res.send({clientSecret:paymentIntent.client_secret});
  
  
  
  
  
  })
//PAYMENT...................................................................






   //.......................................................................................
   app.get('/service',async(req,res)=>{      
    const query ={};
    const cursor=serviceCollection.find(query);
    const product=await cursor.toArray();
    res.send(product);

   })


   app.delete('/service/:id',async (req,res)=>{
    const id=req.params.id;
    const query ={_id:ObjectId(id)};
    const result =await serviceCollection.deleteOne(query);
    res.send(result);
    
    
    
    })





   app.post('/service',async (req,res)=>{
  
    const newProduct=req.body;
    console.log(newProduct)
    const service =await serviceCollection.insertOne(newProduct)
    res.send(service)
    })


  


   app.get('/service/:id',async(req,res)=>{
    const id=req.params.id;
    const query={_id: ObjectId(id)}
    const booking=await serviceCollection.findOne(query);
    res.send(booking)
  })
  
   //................................................................................
  







  //...................................................................................................
   app.get('/reviews',async(req,res)=>{
    const query ={};
    const cursor=reviewsCollection.find(query);
    const reviews=await cursor.toArray();
    res.send(reviews);
    
   })


   app.post('/reviews',async (req,res)=>{
  
    const newProduct=req.body;
    console.log(newProduct)
    const reviews =await reviewsCollection.insertOne(newProduct)
    res.send(reviews)
    })

  //.....................................................................




  //.................................................................................
 app.put('/user/admin/:email',verifyJWT,async (req,res)=>{
    const email=req.params.email;
    const requester=req.decoded.email
    const requesterAccount=await userCollection.findOne({email:requester});
    if(requesterAccount.role ===  'admin'){
      const filter={email: email};
      const updateDoc={
        $set:{role:'admin'},
      }
      const result=await userCollection .updateOne(filter,updateDoc);
      res.send(result);
  
    }
    else{
      res.status(403).send({message: 'forbidden'})
    }
    }) 

    app.get('/admin/:email',async (req,res)=>{
      const email=req.params.email;
      const user=await userCollection.findOne({email: email});
      const isAdmin=user.role === 'admin';
      res.send({admin: isAdmin})
      
      })
      


 
//...............................................................................................








  app.put('/user/:email',async (req,res)=>{
    const email=req.params.email;
    const user=req.body
    const filter={email: email};
    const option ={upsert:true};
    const updateDoc={
      $set:user,
    };
    const result=await userCollection.updateOne(filter,updateDoc,option);
    //token.............................................
    const token=jwt.sign({email:email},process.env.ACCESS_TOKEN,{expiresIn: '1h'})
    
    res.send({result,token});
  
    })



    app.get('/user',verifyJWT,async(req,res)=>{
      const user=await userCollection.find().toArray();
      res.send(user)
    })
    



  //.................................................................................




  //....................................................................
  app.post('/order',async (req,res)=>{
  
    const orderProduct=req.body;
    console.log(orderProduct)
    const order =await orderCollection.insertOne(orderProduct)
    res.send(order)
    })


//......................................................
  app.get('/order',async(req,res)=>{
    const order=await orderCollection.find().toArray();
    res.send(order)
})




app.delete('/order/:id',async (req,res)=>{
  const id=req.params.id;
  const query ={_id:ObjectId(id)};
  const result =await orderCollection.deleteOne(query);
  res.send(result);
  
  
  
  })




//............................................


app.get('/myorder',async (req,res)=>{
  const email=req.query.email;
  console.log(email)
  const query={email : email}
  const order=await orderCollection.find(query).toArray();
  res.send(order)
  
  })

  app.get('/myorder/:id',async (req,res)=>{
    const id=req.params.id;
    const query ={_id:ObjectId(id)};
    const result =await orderCollection.findOne(query);
    res.send(result);
    
    
    
    }) 



    
app.delete('/myorder/:id',async (req,res)=>{
  const id=req.params.id;
  const query ={_id:ObjectId(id)};
  const result =await orderCollection.deleteOne(query);
  res.send(result);
  
  
  
  })

    //..............................................

  //....................................................................
  app.patch('/myorder/:id',async (req,res)=>{
    const id=req.params.id;
    const payment=req.body;
    const filter ={_id:ObjectId(id)};
    const updateDoc={

      $set:{
      paid:true,
      transactionId:payment.transactionId
      }
      
    }

    const UpdateOrderPayment =await orderCollection.updateOne(filter,updateDoc);
    const result = await paymentCollection.insertOne(payment)
    res.send(updateDoc);
    
    
    
    }) 

//........................................................................





}

finally{

}


}run().catch(console.dir);




app.get('/',(req,res)=>{
  res.send('running server ')
});


app.listen(port,()=>{

console.log("I AM FIRST OPERATION MOZAHID",port)

})