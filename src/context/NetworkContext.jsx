
// import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
// import { getPendingAttendance, getFailedAttendance } from '../utils/offlineSync';

// const NetworkContext = createContext(null);

// export const useNetwork = () => {
//     const ctx = useContext(NetworkContext);
//     if (!ctx) throw new Error('useNetwork must be used within NetworkProvider');
//     return ctx;
// };

// const HEALTH_ENDPOINT = 'http://localhost:8080/actuator/health';
// const UNSTABLE_THRESHOLD_MS = 3000;
// const POLL_INTERVAL_MS = 15000;

// const measureLatency = async () => {
//     const start = Date.now();
//     try {
//         const controller = new AbortController();
//         const timeout = setTimeout(() => controller.abort(), UNSTABLE_THRESHOLD_MS + 500);
//         await fetch(HEALTH_ENDPOINT, { method: 'HEAD', signal: controller.signal, cache: 'no-store' });
//         clearTimeout(timeout);
//         return Date.now() - start;
//     } catch {
//         return Infinity;
//     }
// };

// export const NetworkProvider = ({ children }) => {
//     const [isOnline, setIsOnline] = useState(navigator.onLine);
//     const [networkStatus, setNetworkStatus] = useState(navigator.onLine ? 'ONLINE' : 'OFFLINE');
//     const [pendingCount, setPendingCount] = useState(0);
//     const [failedCount, setFailedCount] = useState(0);
//     const [isSyncing, setIsSyncing] = useState(false);
//     const pollRef = useRef(null);

//     const refreshCounts = useCallback(async () => {
//         try {
//             const [pending, failed] = await Promise.all([
//                 getPendingAttendance(),
//                 getFailedAttendance()
//             ]);
//             setPendingCount(pending.length);
//             setFailedCount(failed.length);
//         } catch {
//             // silent
//         }
//     }, []);

//     const checkStability = useCallback(async () => {
//         if (!navigator.onLine) return;
//         const latency = await measureLatency();
//         if (latency === Infinity) {
//             setNetworkStatus('UNSTABLE');
//         } else if (latency > UNSTABLE_THRESHOLD_MS) {
//             setNetworkStatus('UNSTABLE');
//         } else {
//             setNetworkStatus('ONLINE');
//         }
//     }, []);

//     useEffect(() => {
//         refreshCounts();

//         const handleOnline = () => {
//             setIsOnline(true);
//             setNetworkStatus('ONLINE');
//             refreshCounts();
//             checkStability();
//         };
//         const handleOffline = () => {
//             setIsOnline(false);
//             setNetworkStatus('OFFLINE');
//         };

//         window.addEventListener('online', handleOnline);
//         window.addEventListener('offline', handleOffline);

//         // Periodic stability check + count refresh
//         pollRef.current = setInterval(() => {
//             checkStability();
//             refreshCounts();
//         }, POLL_INTERVAL_MS);

//         // Refresh counts on storage events (other tabs)
//         window.addEventListener('storage', refreshCounts);

//         return () => {
//             window.removeEventListener('online', handleOnline);
//             window.removeEventListener('offline', handleOffline);
//             window.removeEventListener('storage', refreshCounts);
//             clearInterval(pollRef.current);
//         };
//     }, [refreshCounts, checkStability]);

//     const value = {
//         isOnline,
//         networkStatus,   // 'ONLINE' | 'OFFLINE' | 'UNSTABLE'
//         pendingCount,
//         failedCount,
//         isSyncing,
//         setIsSyncing,
//         refreshCounts,
//     };

//     return (
//         <NetworkContext.Provider value={value}>
//             {children}
//         </NetworkContext.Provider>
//     );
// };

// export default NetworkContext;



/**
 * NetworkContext.jsx
 */

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef
} from 'react';

import {
    getPendingAttendance,
    getFailedAttendance
} from '../utils/offlineSync';

const NetworkContext = createContext(null);

export const useNetwork = () => {

    const context = useContext(NetworkContext);

    if (!context) {
        throw new Error(
            'useNetwork must be used within NetworkProvider'
        );
    }

    return context;
};


const HEALTH_ENDPOINT = 'http://localhost:8080/actuator/health';

const UNSTABLE_THRESHOLD_MS = 3000;

const POLL_INTERVAL_MS = 15000;



const measureLatency = async () => {

    const start = Date.now();

    const controller = new AbortController();

    let timeout;

    try {

        timeout = setTimeout(() => {

            controller.abort();

        }, UNSTABLE_THRESHOLD_MS + 500);


        const response = await fetch(HEALTH_ENDPOINT, {

            method: 'GET',

            signal: controller.signal,

            cache: 'no-store'

        });


        if (!response.ok) {

            throw new Error(
                `Health check failed : ${response.status}`
            );
        }

        return Date.now() - start;

    }

    catch (err) {

        console.error(
            'Health Check Error : ',
            err
        );

        return Infinity;
    }

    finally {

        clearTimeout(timeout);

    }

};



export const NetworkProvider = ({ children }) => {

    const [isOnline, setIsOnline] = useState(
        () => navigator.onLine
    );


    const [networkStatus, setNetworkStatus] = useState(

        navigator.onLine
            ? 'ONLINE'
            : 'OFFLINE'
    );


    const [pendingCount, setPendingCount] = useState(0);

    const [failedCount, setFailedCount] = useState(0);

    const [isSyncing, setIsSyncing] = useState(false);

    const pollRef = useRef(null);



    const refreshCounts = useCallback(async () => {

        try {

            const [pending, failed] = await Promise.all([

                getPendingAttendance(),

                getFailedAttendance()

            ]);


            setPendingCount(pending.length);

            setFailedCount(failed.length);

        }

        catch (err) {

            console.error(
                'Error refreshing counts : ',
                err
            );
        }

    }, []);



    const checkStability = useCallback(async () => {

        if (!navigator.onLine) {

            setNetworkStatus('OFFLINE');

            return;
        }


        const latency = await measureLatency();


        if (latency === Infinity) {

            setNetworkStatus('UNSTABLE');

        }

        else if (

            latency > UNSTABLE_THRESHOLD_MS

        ) {

            setNetworkStatus('UNSTABLE');

        }

        else {

            setNetworkStatus('ONLINE');

        }

    }, []);



    useEffect(() => {

        refreshCounts();

        checkStability();



        const handleOnline = () => {

            setIsOnline(true);

            setNetworkStatus('ONLINE');

            refreshCounts();

            checkStability();

        };



        const handleOffline = () => {

            setIsOnline(false);

            setNetworkStatus('OFFLINE');

        };



        window.addEventListener(
            'online',
            handleOnline
        );


        window.addEventListener(
            'offline',
            handleOffline
        );



        window.addEventListener(
            'storage',
            refreshCounts
        );



        pollRef.current = setInterval(() => {

            refreshCounts();

            checkStability();

        }, POLL_INTERVAL_MS);



        return () => {

            window.removeEventListener(
                'online',
                handleOnline
            );


            window.removeEventListener(
                'offline',
                handleOffline
            );


            window.removeEventListener(
                'storage',
                refreshCounts
            );


            clearInterval(
                pollRef.current
            );

        };

    }, [refreshCounts, checkStability]);



    const value = {

        isOnline,

        networkStatus,

        pendingCount,

        failedCount,

        isSyncing,

        setIsSyncing,

        refreshCounts

    };



    return (

        <NetworkContext.Provider value={value}>

            {children}

        </NetworkContext.Provider>

    );

};


export default NetworkContext;