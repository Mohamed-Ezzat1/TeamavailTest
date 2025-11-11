#!/bin/sh 

case "$1" in 
	init)
		docker build -t nodeapp ..
	docker run -d -p 3000:3000 --name node_app nodeapp
        echo "started at port 3000"
	;;


start)
docker start node_app
;;
	stop)
                docker stop node_app
        echo "stopped"
        ;;	

esac
