openssl s_client -connect lnd_btc:10009 -prexit

apt-get update && apt-get install tcpdump
tcpdump port 10009 and '(tcp-syn|tcp-ack)!=0'

curl --cacert /secure/tls.cert https://lnd_btc:10009 -v
