#Data taken from https://steamspy.com/
local_path = 't5.csv'


#Reading in file and storing it in a data frame
infile = open(local_path,'r')
file_contents = infile.readlines()


#Data arrays
gameDate = []
gameName = []
gamePrice = []
gameRank = []
gameUserScore = []


#parse to remove all '\t' charachters and store in a new array
myNew = []
for i in range(1,101):
    new = file_contents[i].split("\t")
    myNew.append(new)


#Parse the remaining values into their appropriate values
#and append those values into separate arrays
for j in range(0,100):
    #if not/applicable, userRank will = 'N'
    val = myNew[j][4].split(' ')
    rank = val[0]
    userRank = val[1].strip('()').split('/')[0]

    #adding values to their appropriate arrays
    gameName.append(myNew[j][1])
    gameDate.append(myNew[j][2])
    gamePrice.append(myNew[j][3])
    gameRank.append(rank)
    gameUserScore.append(userRank)
