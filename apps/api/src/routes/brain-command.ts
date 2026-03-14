import { Router } from "express"
import { exec } from "child_process"

const router = Router()

function run(cmd:string){
 return new Promise((resolve)=>{
  exec(cmd,(e,stdout,stderr)=>{
   resolve({stdout,stderr})
  })
 })
}

router.post("/brain/command",async(req,res)=>{

 const {command} = req.body

 const map:any={
  demo:"/root/workspace/parabellum-os/brain-demo",
  rewards:"/root/workspace/parabellum-os/brain-rewards",
  marketing:"/root/workspace/parabellum-os/brain-marketing",
  contract:"/root/workspace/parabellum-os/brain-contract"
 }

 if(!map[command]){
  return res.status(400).json({error:"invalid command"})
 }

 const result=await run(map[command])

 res.json({
  ok:true,
  command,
  result
 })
})

export default router
