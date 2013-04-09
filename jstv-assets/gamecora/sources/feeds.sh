#!/bin/bash
#
# Reads a tab separated file called feeds.tsv and generates the all.json file
# for Gamecora TV.
#
# To update all.json file
#
# - Apply changes to feeds.odt
# - Copy the first 5 columns of the sheet
# - Paste them in feeds.tsv (columns should be tab separated)
# - Launch this script
#
outfile="../../../gamecora/sources/all.json"
echo -e "[" > $outfile
IFS=$'\n'
first="1"
for a in $(cat feeds.tsv|sed "s/“/\"/g;s/”/\"/g"|grep -v "^#"); do
	
        if [[ "$first" -eq "1" ]]; then
                first="0";
        else

                url="$(echo "$a"|sed "s/\t.*//;s/[ |\t]*$//;s/^twitter:/twitter:/i;s/^flickr:/flickr:/i;s/^youtube:/youtube:/i;s/^http/http/i")";
                a="$(echo "$a"|sed "s/^[^\t]*\t//")";

                tag="$(echo "$a"|sed "s/\t.*//;s/ //g;;s/^,*//;s/,,/,/g;s/,,/,/g;s/,,/,/g;s/,,/,/g;s/,,/,/g;s/,,/,/g;s/,,/,/g")";
                a="$(echo "$a"|sed "s/^[^\t]*\t//")";

                diz="$(echo "$a"|sed "s/\t.*//;s/[ |\t]*$//")";
                a="$(echo "$a"|sed "s/^[^\t]*\t//")";

                about="$(echo "$a"|sed "s/\t.*//;s/[ |\t]*$//")";
                a="$(echo "$a"|sed "s/^[^\t]*\t//")";

                notes="$(echo "$a"|sed "s/\t.*//;s/[ |\t]*$//")";
                a="$(echo "$a"|sed "s/^[^\t]*\t//")";
         
                queue="rss";
                if [[ "$(echo "$url"|grep "youtube")" != "" ]]; then queue="youtube"; fi
                if [[ "$(echo "$url"|grep "twitter")" != "" ]]; then queue="tweets"; fi
                if [[ "$(echo "$url"|grep "flickr")" != "" ]]; then queue="flickr"; fi

                echo -e "\t{" >> $outfile
                echo -e "\t\t\"url\":\"${url}\"," >> $outfile
                echo -e "\t\t\"queue\":\"${queue}\"," >> $outfile
                echo -e "\t\t\"tag\":[${tag}]," >> $outfile
                if [[ "$about" != "" ]]; then echo -e "\t\t\"about\":\"${about}\"," >> $outfile; fi
                if [[ "$notes" != "" ]]; then echo -e "\t\t\"notes\":\"${notes}\"," >> $outfile; fi
                echo -e "\t\t\"description\":\"${diz}\"" >> $outfile
                echo -e "\t}," >> $outfile

                echo "URL: "$url
                echo "QUE: "$queue
                echo "TAG: "$tag
                echo "DIZ: "$diz
                echo "ABO: "$about
                echo "NOT: "$notes
                echo "---"

        fi
done
sed -i '$s/,$//' $outfile
echo -e "]" >> $outfile