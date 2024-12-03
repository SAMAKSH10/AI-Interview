import React, { useEffect, useState } from "react";
import { fetchApi,changeApiKey } from "../firebase";
import { toast } from "react-toastify";


function AdminApiKeyManager(){
    const[apiKey,setApiKey] = useState('');
    const[currentkey,setCurrentKey] = useState('');
    

    useEffect(() => {
        const fetchData = async () => {
          const data = await fetchApi(); // Await the asynchronous fetch
          setCurrentKey(data || ""); // Ensure default value is an empty string
        };
        
        fetchData(); // Call the async function
      }, []);
      
    
    const handleSubmit = async()=>{
       // e.preventDefaut();
        try{
            setCurrentKey(apiKey)
            changeApiKey(apiKey);
            toast.success('Successfully Api key changed');
            setApiKey('')
        }catch(err){
            toast.error('Error in changing Api key');
            console.log('Error : ',err);
        }
    }

    return(
        <div className="max-w-xl mx-auto p-8 bg-gray-800 text-white rounded-lg shadow-lg mt-20">
  <h2 className="text-3xl font-semibold text-gray-300 mb-4 p-10 text-center">Admin - Update API Key</h2>
  <p className="text-gray-600 mb-6">
    <span className="font-medium text-gray-300 p-2">Current API Key :</span> <span className="text-gray-400 rounded-lg">{currentkey || "Loading..."}</span> 
  </p>
  <form onSubmit={handleSubmit} className="space-y-10 mt-10">
    <label className="block">
      <span className="text-gray-300 text-xs">New API Key:</span>
      <input
        type="text"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        required
        placeholder="Enter new api key"
        className="mt-1 bg-gray-900 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </label>
    <button
    onClick={handleSubmit}
      type="button"
      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Update Key
    </button>
  </form>
</div>

    );

}
export default AdminApiKeyManager;