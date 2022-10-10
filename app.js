const express = require('express')

const app = express()

app.use(express.json())//funcion que se ejecuta antes que la info llegue a las rutas

app.get('/', function(req, res){
    res.send('hola mundo 2')
})
app.post('/imagen', function(req, res){
    const body = req.body
    console.log(body)
    res.send('hola mundo desde el post')
})

const PORT = process.env.PORT||3000 //Variable de entorno PORT
app.listen(PORT, function(){
    console.log("servidor escuchando en el puerto", PORT)
}) //si ponemos un puerto aqui quedaria fijo, pero con heroku tenemos un asignado.