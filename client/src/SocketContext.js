import React, {createContext,useState, useRef,useEffect} from 'react';
import { io } from "socket.io-client";
import Peer from 'simple-peer';

const SocketContext  = createContext();

const socket = io('http://localhost:5000');

const ContextProvider = ({children}) =>{ 

    const [me, setMe] = useState('');
    const [stream, setStream] = useState(null);
    const [call, setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('')
    

    const myVedio = useRef();
    const userVedio = useRef();
    const connectionRef = useRef();

    useEffect(() =>{ 
        navigator.mediaDevices.getUserMedia({video: true, audio: true})
        .then((currentStream) =>{
            setStream(currentStream);

            myVedio.current.srcObject =currentStream;

        });
        socket.on('me',(id) =>setMe(id));
        socket.on('calluser',({from, name:callerName, signal}) =>{
            setCall({isRecivedCall:true,from, name:callerName, signal })

        });
    },[])

    const answerCall = () => { 
        setCallAccepted(true);

        const peer = new Peer({ initiator: false, trickle:false, stream});

        peer.on('signal', (data) =>{
            socket.emit('answercall',{signal: data, to: call.from});
        });
        peer.on('stream',(cutterntStream) =>{

            userVedio.current.srcObject = cutterntStream;
        });

        peer.signal(call.signal);
        connectionRef.current = peer;

    }

    const callUser = (id) =>{

        const peer = new Peer({ initiator: true, trickle:false, stream});

        peer.on('signal', (data) =>{
            socket.emit('calluser',{userToCall:id, signalData: data, from:me , name});
        });
        peer.on('stream',(cutterntStream) =>{

            userVedio.current.srcObject = cutterntStream;
        });

        socket.on('callaccepted',(signal) =>{
            setCallAccepted(true);
            peer.signal(signal);
        })
        connectionRef.current = peer;

    }

    const leaveCall = () => {
        setCallEnded(true);
        connectionRef.current.distroy();

        window.location.reload();

    }
    return (
        <SocketContext.Provider value={{call,callAccepted,myVedio,userVedio,stream,name,setName,callEnded,me,callUser,leaveCall,answerCall,
             }}>
{children}
        </SocketContext.Provider>
    );

}

export {ContextProvider, SocketContext};

