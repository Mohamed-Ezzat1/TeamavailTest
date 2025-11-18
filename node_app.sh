#!/bin/sh 

case "$1" in 

start)
docker-compose up --build 
;;
	stop)
                docker-compose down 
        echo "stopped"
        ;;	

esac
