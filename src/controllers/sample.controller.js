
import sampleService from "../services/sample.service.js";

const S_Controller =async (req,res)=>{
   const result = sampleService();
   res.json(result);
}

export default S_Controller;