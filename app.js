const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs') //manejo de archivos usado para crear un archivo con el buffer

const storageStrategy = multer.memoryStorage()
const upload = multer({ storage: storageStrategy })
const app = express()

app.use(express.json())//funcion que se ejecuta antes que la info llegue a las rutas

app.get('/', function(req, res){
    res.send('hola mundo 2')
})
app.post('/imagen', upload.single('imagen'), async function(req, res){ //debe ser async por el await y son procesos que deben terminar en un tiempo
    //const body = req.body
    const imagen = req.file
    const processedImage = sharp(imagen.buffer)
    const resizedImage = processedImage.resize(800,600, {
        fit:  "contain",
        background: "#FFF"
    }) //ctrl+space para ver las opciones
    const resizedImageBuffer = await resizedImage.toBuffer() //devuelve una promesa, necesitamos un await para que se finalice el buffer de datos
    fs.writeFileSync('nuevaruta/prueba.png', resizedImageBuffer) //la carpeta ya debe estar creada
    console.log(resizedImageBuffer)
    res.send({ resizedImage: resizedImageBuffer})
})

const PORT = process.env.PORT||3000 //Variable de entorno PORT
app.listen(PORT, function(){
    console.log("servidor escuchando en el puerto", PORT)
}) //si ponemos un puerto aqui quedaria fijo, pero con heroku tenemos un asignado.