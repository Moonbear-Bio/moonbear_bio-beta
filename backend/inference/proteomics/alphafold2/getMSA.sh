#!/bin/bash
USE_AMBER=$1
USE_MSA=$2
USE_TEMPLATES=$3
NAME=$4
USE_ENV=$5

if [ "${USE_MSA}" == "True" ] || [ "${USE_TEMPLATES}" == "True" ]; then
  if [ ! -f ${NAME}.mmseqs2.tar.gz ]; then
    # query MMseqs2 webserver
    echo "submitting job"
    MODE=all
    if [ ${USE_ENV} == "True" ]; then
      MODE=env
    fi
    ID=$(curl -s -F q=@${NAME}.fasta -F mode=${MODE} https://a3m.mmseqs.com/ticket/msa | jq -r '.id')
    STATUS=$(curl -s https://a3m.mmseqs.com/ticket/${ID} | jq -r '.status')
    while [ "${STATUS}" == "RUNNING" ] || [ "${STATUS}" == "PENDING" ]; do
      STATUS=$(curl -s https://a3m.mmseqs.com/ticket/${ID} | jq -r '.status')
      sleep 1
    done
    if [ "${STATUS}" == "COMPLETE" ]; then
      curl -s https://a3m.mmseqs.com/result/download/${ID} >${NAME}.mmseqs2.tar.gz
    else
      echo "MMseqs2 server did not return a valid result."
      cp ${NAME}.fasta ${NAME}.a3m
    fi
  fi
  tar xzf ${NAME}.mmseqs2.tar.gz
  if [ ${USE_ENV} == "True" ]; then
    cat uniref.a3m bfd.mgnify30.metaeuk30.smag30.a3m >tmp.a3m
    tr -d '\000' <tmp.a3m >${NAME}.a3m
    rm uniref.a3m bfd.mgnify30.metaeuk30.smag30.a3m tmp.a3m
  else
    tr -d '\000' <uniref.a3m >${NAME}.a3m
    rm uniref.a3m
  fi
  mv pdb70.m8 ${NAME}.m8
  if [ ${USE_MSA} == "True" ]; then
    echo "Found $(grep -c ">" ${NAME}.a3m) sequences (after redundacy filtering)"
  fi
  if [ ${USE_TEMPLATES} == "True" ] && [ ! -f ${NAME}_hhm.ffindex ]; then
    echo "getting templates"
    if [ -s ${NAME}.m8 ]; then
      if [ ! -d templates ]; then
        mkdir templates/
      fi
      printf "pdb\tevalue\n"
      head -n 20 ${NAME}.m8 | awk '{print $2"\t"$11}'
      TMPL=$(head -n 20 ${NAME}.m8 | awk '{printf $2","}')
      curl -s https://a3m-templates.mmseqs.com/template/${TMPL} | tar xzf - -C templates/
      mv templates/pdb70_a3m.ffdata ${NAME}_a3m.ffdata
      mv templates/pdb70_a3m.ffindex ${NAME}_a3m.ffindex
      mv templates/pdb70_hhm.ffdata ${NAME}_hhm.ffdata
      mv templates/pdb70_hhm.ffindex ${NAME}_hhm.ffindex
      cp ${NAME}_a3m.ffindex ${NAME}_cs219.ffindex
      touch ${NAME}_cs219.ffdata
    else
      echo "no templates found"
    fi
  fi
fi
