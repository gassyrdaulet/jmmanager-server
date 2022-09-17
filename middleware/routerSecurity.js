import jwt from 'jsonwebtoken'
import config from 'config'

export const auth = (req,res,next) => {
    if (req.method === 'OPTIONS') {
        next()
    }
    try{
        const token = req.headers.authorization.split(' ')[1]
        if(!token){
            return res.status(403).json({message: "Unauthorized."})
        }
        const decodedData = jwt.verify(token, config.get('secretKey'))
        req.user = decodedData
        next()
    } catch(e) {
        if (e.name === 'JsonWebTokenError') {res.status(403).json({message: "You have no rights for this."})} else {res.sendStatus(403)}
    }
}

export const authRole = (roles) => {
    return function(req, res, next) {
        if (req.method === 'OPTIONS'){
            next()
        }
        try{
            const token = req.headers.authorization.split(' ')[1]
            if(!token){
                return res.status(403).json({message: "Unauthorized."})
            }
            const {role: userRole} = jwt.verify(token, config.get('secretKey'))
            let hasRole = false
            roles.forEach(role => {
                if (role === userRole){
                    hasRole = true
                }
            });
            if(!hasRole){
                return res.status(403).json({message: 'Forbidden action.'})
            }
            next()
        }catch(e){
            console.log(e)
            return res.status(400).json({message: 'Token expired.'})
        }
    }
    
}