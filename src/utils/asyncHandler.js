 // can be done using promise and try catch
 //const asyncHandler=()=>{}
 //const asyncHandler=(func)=>()=>{}
 //const asyncHandler=(func)=>async()=>{}
    //using try catch
    /*
 const asyncHandler=(func)=>async(req,res,next)=>{
    try{
        await func(req,res,next)
    }catch(error){
        res.status(error.code||500).json({
            success:false,
            message:error.message
        })
    }
 }*/

    //using promise
    const asyncHandler=(requestHandler)=>{
        return (res,req,next)=>{
            Promise.resolve(requestHandler(req,res,next)).
            catch((err)=>next(err))
        }
    }
    export {asyncHandler}

