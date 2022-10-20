const express = require('express')
const multer = require('multer')

const upload = multer({dest: 'uploads/'})
const app = express()

app.use(express.json())//funcion que se ejecuta antes que la info llegue a las rutas

app.get('/', function(req, res){
    res.send('hola mundo 2')
})
app.post('/imagen', upload.single('imagen'), function(req, res){
    const body = req.body
    const image = req.file
    console.log(image)
    res.send('hola mundo desde el post')
})

const PORT = process.env.PORT||3000 //Variable de entorno PORT
app.listen(PORT, function(){
    console.log("servidor escuchando en el puerto", PORT)
}) //si ponemos un puerto aqui quedaria fijo, pero con heroku tenemos un asignado.