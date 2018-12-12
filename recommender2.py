import psycopg2
import pandas as pd
import numpy as np
import math
import sys
import os

#This allows for the express server to pass the script a userId
#ternary is to hopefully avoid compromising the test scripts
userId = int(sys.argv[1]) if len(sys.argv) == 2 else 1;


#def cosSim(x row of scores, y row of scores) of equal length
def cosSim(x,y):
    sum=0
    sumx=0
    sumy=0
    for i in range(0, len(x)):
        sum+=x[i]*y[i]
        sumx+=x[i]**2
        sumy+=y[i]**2
    if(sumx==0 or sumy==0): return 0
    final=sum/(math.sqrt(sumx)*math.sqrt(sumy))
    return final


#highest score arguments: [id, sim score], list of 5 [id, sim score]
def reorganize_list(pairing,id_max_list):
    id_max_list.append(pairing)
    for passnum in range(len(id_max_list)-1,0,-1):
        for i in range(passnum):
            if id_max_list[i][1]>id_max_list[i+1][1]:
                temp = id_max_list[i]
                id_max_list[i] = id_max_list[i+1]
                id_max_list[i+1] = temp
    return id_max_list[1:]


#print(reorganize_list([1,0.86],[[2,0.77],[4,0.44],[6,0.9],[7,0.3],[10,0.1]]))


#maxSimilarity takes in a users ID and a untransposed list returns top 5 users
def maxSimilarity(userId, a):
    b=np.array(a)
    b=b.transpose()

    most_simIDs=[]
    #first need to find the index of the userID and create a user matrix with appromaximated mean values

    userMatrix=b[userId-1][1:]
    i=0
    #id_list=[[id1,sim_score1],[id2,sim_score2],...]
    id_list=[[0,0],[0,0],[0,0],[0,0],[0,0]]
    while i < len(b):
        if i!=userId-1:
            sim=cosSim(userMatrix,b[i][1:])
            id_list=reorganize_list([i+1,sim], id_list)
        i+=1
    return id_list


#find_sim_items takes in the users ID, and a max sim list and sums up values that the user hasnt played
def find_sim_items(userId,maxsim_list):
    b=np.array(a)
    b=b.transpose()


    i=1
    #bestItems=[movieName or column #, mean score]
    bestItems=[[0,0],[0,0],[0,0]]
    #going through the users rated items
    while i< len(b[userId-1]):
        if b[userId-1][i]==0:
            sum1=0
            count=0
            #seeing the max similarities what they ranked it
            for j in range(0,len(maxsim_list)):
                #based on weight given by similarity score
                user=maxsim_list[j][0]
                sum1+=b[user-1][j]*maxsim_list[j][1]
                if b[user-1][j]!=0:
                    count+=maxsim_list[j][1]
            if(count==0):
                i += 1
                continue
            bestItems=reorganize_list([i,float(sum1/count)],bestItems)
        i+=1
    return bestItems



if __name__ == "__main__":
	DATABASE_URL = sys.argv[2]
    #sql connection
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')

    df=pd.read_sql("select * from game_ratings order by id asc",conn)
    df=df.replace({np.nan:0})
    df=df.drop(columns=['id'])
    a=df.values.T.tolist()
    similarItems=find_sim_items(userId,maxSimilarity(userId,a))
    val=similarItems[2][0]
    b=list(df)
    print(b[val])
    sys.stdout.flush()
    conn.close()
