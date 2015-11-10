var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
var width=1400;
var height=700;
var mapwidth=1320;
var mapheight=700;
var time;
var rad=10;
var speed;
var dx,dy;
var cx,cy;
var mousedown;
var units;
var sel;
var maxhealth=100;
var bmaxhealth=300;
var maxorg=100;
var att=10;
var pos;
var numofp=2;
var color=['rgb(' + 220 + ',' + 220 + ',220)','rgb(' + 230 + ',' + 50 + ',40)'
           ,'rgb(' + 80 + ',' + 80 + ',200)'];
var menucolor=['rgb(' + 220 + ',' + 220 + ',220)','rgb(' + 170 + ',' + 100 + ',90)'
               ,'rgb(' + 100 + ',' + 100 + ',150)'];
var cancontrol=[false,true,true];
var isai=[false,true,true];
var ftable;
var barlen=30;
var barwid=5;
var regions;
var imgData;
var stsupply=500;
var stmanpower=500;
var stresource=500;
var civilcolor='rgb(' + 220 + ',' + 220 + ',220)';
var sides;
var stnumunits=10;
var sight=50;
var buildings;
var playerside=1;
var mousemod;
init();
var IMG=convertCanvasToImage(c);
var id=setInterval(paint, 10);




//Physics
function init(){
	mousemod=0;//0:select,1:repair,2:build
	dx=0;dy=0;cx=0;cy=0;
	mousedown=false;
	time=0;
	speed=1;
	sel=[];
	regions=[];
	pos=[];
	units=[];
	ftable=[[],[],[]];
	sides=[];
	for(i=0;i<mapheight/(10*2*rad/1.3);i++){
		regions[i]=[];
		for(j=0;j<mapwidth/(10*2*rad);j++){
			var x=j*10*2*rad;
			if(i%2==0){
				x+=10*rad;
			}
			regions[i][j]=new region(x,i*10*2*rad/1.3);
		}
	}
	for(i=0;i<mapwidth/(2*rad);i++){
		pos[i]=[];
		for(j=0;j<mapheight/(2*rad);j++){
			pos[i][j]=new position(i,j);
		}
	}
	for(i=0;i<=numofp;i++){
		sides[i]=new side(i,cancontrol[i],isai[i]);
	}
	for(i=0;i<=numofp;i++){
		units[i]=[];
		for(j=0;j<stnumunits;j++){
			units[i][j]=new unit(cancontrol[i],i);
		}
	}
	buildings=[];
	for(j=0;j<regions.length;j++){
		for(i=0;i<regions[j].length;i++){
			regions[j][i].addbuildings();
			if(regions[j][i].side==0){
				regions[j][i].side=Math.round(Math.random())+1;
			}
		}
	}
	ftable[0][0]=true;ftable[0][1]=true;ftable[0][2]=false;
	ftable[1][0]=true;ftable[1][1]=true;ftable[1][2]=false;
	ftable[2][0]=false;ftable[2][1]=false;ftable[2][2]=true;
	paintbg();
}
function unit(pcontrol,side){
	this.prei=0;// position index i
	this.prej=0;//position index j
	this.x=0;//x coordinate
	this.y=0;//y coordinate
	this.sel=false;//selected
	this.supplied=true;
	this.pcontrol=pcontrol;//can control
	this.att=att;//attack
	this.health=maxhealth;//health
	this.org=maxorg;//organization
	this.side=side;//side INDEX:int
	this.target=null;;//target:unit
	this.rest=0;//counter
	this.pos;//position:position
	this.nof=0;//counter
	this.topos=function(i,j,jump){//helper
		this.prei=i;
		this.prej=j;
		this.pos=pos[i][j];
		if(this.pos.iscentre&&this.pos.region.side!=this.side){
			if(this.pos.region.isbase&&this.pos.region.side!=0){
				var possibase=[];
				for(j0=0;j0<regions.length;j0++){
					for(i0=0;i0<regions[j0].length;i0++){
						if(regions[j0][i0].isbase){
							continue;
						}
						if(regions[j0][i0].side==this.pos.region.side){
							possibase[possibase.length]=regions[j0][i0];
						}
					}
				}
				if(possibase.length!=0){
					sides[this.pos.region.side].stregion=possibase[Math.round(50*Math.random())%possibase.length];
					sides[this.pos.region.side].stregion.isbase=true;
				}
			}
			this.pos.region.isbase=false;
			var nobase=true;
			for(j0=0;j0<regions.length;j0++){
				for(i0=0;i0<regions[j0].length;i0++){
					if(regions[j0][i0].side==this.side){
						nobase=false;
						break;
					}
				}
			}
			if(nobase){
				this.pos.region.isbase=true;
				sides[this.side].stregion=this.pos.region;
			}
			this.pos.region.side=this.side;
		}
		if(jump){
			this.x=i*(2*rad)+rad;
			this.y=j*(2*rad)+rad;
		}
		pos[i][j].addunit(this);
	}
	if(this.side!=0){
		while(this.prei==0||pos[this.prei][this.prej]==null||pos[this.prei][this.prej].units.length!=0){
			this.prei=Math.round(Math.random()*7)-3+sides[this.side].stregion.ceni;
			this.prej=Math.round(Math.random()*7)-3+sides[this.side].stregion.cenj;
			if(this.prei<0){
				this.prei=0;
			}
			if(this.prej<0){
				this.prej=0;
			}
		}
		this.topos(this.prei, this.prej,true);
		this.despos=pos[this.prei][this.prej];
	}
	else{
		this.x=-100;
		this.y=-100;
	}
	this.changedes=function(x,y){//change destination:x,y:coordinate
		this.despos=pos[Math.round((x-rad)/(2*rad))][Math.round((y-rad)/(2*rad))];//destination:position
	}
	this.leavepos=function(){//helper
		pos[this.prei][this.prej].units=[];
	}	
	
	this.stepto=function(i,j,jump){//helper
		if(pos[i][j].units.length==0){
			this.leavepos();
			this.topos(i,j,jump);
			this.nof=0;
		}
		else{
			this.nof++;
			this.x=this.prei*(2*rad)+rad;
			this.y=this.prej*(2*rad)+rad;
			this.rest=10;
			var davanti=pos[i][j].units[0];
			if(davanti.despos==davanti.pos&&davanti.pos==this.despos){
				this.despos=pos[this.prei+Math.round((Math.random()*2-1))]
				[this.prej+Math.round((Math.random()*2-1))];
			}
			else if(davanti.despos==davanti.pos){
				var xoff=Math.round((Math.random()*2-1));
				var yoff=Math.round((Math.random()*2-1));
				while(((i-this.prei==-xoff)&&(j-this.prej==-yoff))){
					xoff=Math.round((Math.random()*2-1));
					yoff=Math.round((Math.random()*2-1));
				}
				davanti.despos=pos[davanti.prei+xoff]
				[davanti.prej+yoff];
			}
			else if(this.nof>5){
				this.despos=pos[this.despos.i+Math.round((Math.random()*2-1))]
				[this.despos.j+Math.round((Math.random()*2-1))];
				nof=0;
			}
		}
	}
	this.speedmod=function(){//helper
		switch(this.pos.altitude){
		case -3:return 0.1;break;
		case -2:return 0.2;break;
		case -1:return 0.3;break;
		case 0:return 1;break;
		case 1:return 0.9;break;
		case 2:return 0.8;break;
		case 3:return 0.4;break;
		case 4:return 0.2;break;
		default:return 1;break;
		}
	}
	this.move=function(){//automatic move 
		if(this.rest==0&&this.side!=0){
		var desx=this.despos.x;
		var desy=this.despos.y;
		var disx=desx-this.x;
		var disy=desy-this.y;
		var len=Math.sqrt(disx*disx+disy*disy);
		if(len!=0){
			this.org-=0.02;
			if(this.org<0){
				this.org=0;
				this.rest=10;
			}
			disx=speed*disx/len*this.speedmod();//*this.org/maxorg;
			disy=speed*disy/len*this.speedmod();//*this.org/maxorg;
		}
		//var fi=Math.round(this.x/(2*rad));
		//var fj=Math.round(this.y/(2*rad));
		this.x+=disx;
		this.y+=disy;
		
		var i=Math.round((this.x-rad)/(2*rad));
		var j=Math.round((this.y-rad)/(2*rad));
		if(i!=this.prei||j!=this.prej){
			this.stepto(i,j,false);
		}
		if(this.target!=null&&this.despos==this.pos&&distance(this,this.target)>sight){
			if(this.target.side==0){
				this.target=null;
			}
			else{
				this.despos=this.target.pos;
			}
		}
		}
		else{
			if(this.side!=0){
				this.rest--;
			}
		}
	}
	this.die=function(){
		this.leavepos();
		this.x=-100;
		this.y=-100;
		this.side=0;
		for(ui=1;ui<units.length;ui++){
			for(uj=0;uj<units[ui].length;uj++){
				if(units[ui][uj].side!=0&&units[ui][uj].target==this){
					units[ui][uj].target=null;
					units[ui][uj].despos=units[ui][uj].pos;
				}
			}
		}
		//this.pos=null;
		//this.despos=null;
		this.target=null;
	}
}

function position(i0,j0){
	this.i=i0;//index i
	this.j=j0;//index j
	this.x=i0*2*rad+rad;//central x coordinate
	this.y=j0*2*rad+rad;//central y coordinate
	this.units=[];//units at this position:unit[]
	this.building=null;
	this.altitude=0;
	this.region=regions[0][0];//region it belongs to
	this.color='rgb(' + 100 + ',' + 255 + ',100)';
	this.distanza=function(r){
		if(r==null){
			return 10000;
		}
		return ((this.x-r.x)*(this.x-r.x)+(this.y-r.y)*(this.y-r.y));
	}
	this.toregion=function(){
		var potere=[];
		var bx=Math.floor((this.x-rad)/(10*2*rad));
		var by=Math.floor((this.y-rad)/(10*2*rad/1.4));
		/*if(by+1>=regions.length){
			by=regions.length-2;
		}
		if(bx+1>=regions[by].length){
			bx=regions[by].length-2;
		}*/
		
		if(by>=regions.length){
			by=regions.length-1;
		}
		if(bx>=regions[by].length){
			bx=regions[by].length-1;
		}
		potere[0]=regions[by][bx];
		if(bx+1<regions[by].length){
			potere[1]=regions[by][bx+1];
		}
		else{
			potere[1]=potere[0];
		}
		
		if(by+1<regions.length){
			potere[2]=regions[by+1][bx];
		}
		else{
			potere[2]=potere[1];
		}
		if(by+1<regions.length&&bx+1<regions[by].length){
			potere[3]=regions[by+1][bx+1];
		}
		else{
			potere[3]=potere[2];
		}
		
		if(by+1<regions.length&&bx-1>=0){
			potere[4]=regions[by+1][bx-1];
		}
		else{
			potere[4]=potere[3];
		}
		/*if(bx-2>=0){
			potere[5]=regions[by+1][bx-2];
		}
		else{
			potere[5]=regions[by+1][bx+1];
		}*/
		var minind=0;
		var min=this.distanza(potere[minind]);//this.distanza(potere[0]);
		for(k=0;k<5;k++){
			if(potere[k]==null){
				continue;
			}
			var tmp=this.distanza(potere[k]);//this.distanza(potere[k]);
			if(tmp<min){
				minind=k;
				min=tmp;
				break;
			}
		}
		this.region=potere[minind];
	}
	this.toregion();
	this.iscentre=false;
	if(this.i==this.region.ceni&&this.j==this.region.cenj){
		this.iscentre=true;
	}
	this.setal=function(){
		//this.altitude=2;//Math.abs(Math.round(Math.random()*5));
		var ran=Math.round(70*Math.random())%7-4;
		if(ran>=2||ran<=-2){
			ran=0;
		}
		if(this.i-1>=0){
			if(this.j-1>=0){
				this.altitude=Math.round((pos[this.i-1][this.j].altitude+pos[this.i][this.j-1].altitude)/2)+ran;
			}
			else{
				this.altitude=pos[this.i-1][this.j].altitude+ran;
			}
		}
		else{
			if(this.j-1>=0){
				this.altitude=pos[this.i][this.j-1].altitude+ran;
			}
			else{
				this.altitude=Math.round(9*Math.random()-4);
			}
		}
		if(this.altitude>=3){
			this.altitude-=Math.round(Math.random());
		}
		if(this.altitude>=4){
			this.altitude=4;
		}
		else if(this.altitude<=-3){
			this.altitude=-3;
		}
		var c1=100;
		var c2=255;
		var c3=100;
		if(this.altitude>=0){
		c1=(6-this.altitude)*100/5;
		c2=(6-this.altitude)/5*255;
		c3=(6-this.altitude)/5*100;
		}
		else{
			c1=(6+this.altitude)/5*100;
			c2=(6+this.altitude)/5*100;
			c3=(6+this.altitude)/5*255;
		}
		this.color='rgb(' + c1 + ',' + c2 + ','+c3+')';
	}
	this.setal();
	this.addunit=function (u){//helper
		this.units[this.units.length]=u;
	}
}

function region(x,y){
	this.isbase=false;
	this.side=0;//side INDEX
	this.ceni=Math.round((x-rad)/(2*rad));//central position index i
	this.cenj=Math.round((y-rad)/(2*rad));
	this.x=this.ceni*2*rad+rad;//central x coordinate
	this.y=this.cenj*2*rad+rad;
	var c1=Math.round(255*Math.random());
	var c2=Math.round(255*Math.random());
	var c3=Math.round(255*Math.random());
	this.color='rgb(' + c1 + ',' + c2 + ','+c3+')';//ignore
	this.supply;//ignore
	this.addbuildings=function(){
		var type=Math.round(4*Math.random());//0:city,1:rural,2:mine
		if(type>=2){
			type--;
		}
		switch(type){
		case 0:
			for(i=-2;i<3;i++){
				for(j0=-2;j0<3;j0++){
					if(i==0&&j0==0){
						continue;
					}
					var posi=this.ceni+i;
					var posj=this.cenj+j0;
					if(posi>=0&&posi<pos.length&&posj>=0&&posj<pos[posi].length){
						if(pos[posi][posj].altitude<0||pos[posi][posj].altitude>=3){
							continue;
						}
						else{
							buildings[buildings.length]=new building(buildings.length,0,this,pos[posi][posj]);
						}
					}
				}
			}
			break;
		case 1:
			var posi=Math.round(3*Math.random())-1+this.ceni;
			var posj=Math.round(3*Math.random())-1+this.cenj;
			while((posi==this.ceni&&posj==this.cenj)||(!(posi>=0&&posi<pos.length&&posj>=0&&posj<pos[posi].length))){
				posi=Math.round(3*Math.random())-1+this.ceni;
				posj=Math.round(3*Math.random())-1+this.cenj;
			}
			buildings[buildings.length]=new building(buildings.length,1,this,pos[posi][posj]);
			break;
			break;
		case 2:
			var posi=Math.round(3*Math.random())-1+this.ceni;
			var posj=Math.round(3*Math.random())-1+this.cenj;
			while((posi==this.ceni&&posj==this.cenj)||(!(posi>=0&&posi<pos.length&&posj>=0&&posj<pos[posi].length))){
				posi=Math.round(3*Math.random())-1+this.ceni;
				posj=Math.round(3*Math.random())-1+this.cenj;
			}
			buildings[buildings.length]=new building(buildings.length,2,this,pos[posi][posj]);
			break;
		default:break;
		}
	}
}

function building(i,place,region,pos){
	this.index=i;
	this.health=bmaxhealth;
	this.org=maxorg;
	this.manpower=0;
	this.resource=0;
	this.supply=0;
	this.supplied=true;
	this.region=region;
	this.type;//0:civil,1:factory,2:mine
	switch(place){
	case 0:
		if(Math.round(30*Math.random())%3==0){
			this.type=1;
		}
		else{
			this.type=0;
		}
	break;
	case 1:this.type=0;break;
	case 2:this.type=2;break;
	default:break;
	}
	switch(this.type){
	case 0:this.manpower=10;break;
	case 1:this.supply=10;break;
	case 2:this.resource=10;break;
	default:break;
	}
	this.pos=pos;
	this.pos.building=this;
	this.x=this.pos.x;
	this.y=this.pos.y;
	this.die=function(){
		this.health=0;
	}
	this.side=function(){
		return this.region.side;
	}
}

function side(i,cancontrol,isai){
	this.noterro=1;
	this.index=i;
	this.cancontrol=cancontrol;
	this.isai=isai;//is AI
	/*var c1=Math.round(255*Math.random());
	var c2=Math.round(255*Math.random());
	var c3=Math.round(255*Math.random());
	this.color='rgb(' + c1 + ',' + c2 + ','+c3+')';*/
	this.maxpopulation=0;
	this.supply=0;
	this.manpower=0;
	this.resource=stresource;
	var stpos=pos[Math.round(Math.random()*mapwidth/(2*rad))][Math.round(Math.random()*mapheight/(2*rad))];
	while(stpos.region.side!=0){
		stpos=pos[Math.round(Math.random()*mapwidth/(2*rad))][Math.round(Math.random()*mapheight/(2*rad))];
	}
	this.stregion=stpos.region;
	this.stregion.isbase=true;
	this.stregion.side=this.index;
}

function distance(a,b){
	return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
}

function update(){
	/*
	 * towrite
	 unita1 attacks unit2 when          (var or fun you may use  (units[][],function attack(unit1,unit2))
	 	1.inside range                  (var sight,unit.x,unit.y(coordinate))
	 	2.is enemy                      (function isfriend(unit1,unit2))
	 	3.unit2 is the closest enemy
	 	skip the neutral units(already dead)
	*/
	for(i=1;i<units.length;i++){
		for(j=0;j<units[i].length;j++){
			if(units[i][j].side!=0&&units[i][j].target!=null){
				attack(units[i][j],units[i][j].target);
			}
		}
	}
	//attack(units[1][0],buildings[0]);
	for(i=1;i<sides.length;i++){
		if(sides[i].isai){
			aiperform(sides[i]);
		}
	}
	
	for(i=1;i<units.length;i++){
		for(j=0;j<units[i].length;j++){
		units[i][j].move();
		}
	}
	if(time>=100){
		time=0;
		supply();
	}
	time+=speed;
}

function supply(){
	for(i=0;i<sides.length;i++){
		sides[i].maxpopulation=0;
		if(time%50==0){
			sides[i].supply=0;
		}
	}
	for(j=0;j<regions.length;j++){
		for(i=0;i<regions[j].length;i++){
			sides[regions[j][i].side].maxpopulation+=10;
			if(time%30==0){
				sides[regions[j][i].side].supply+=1;
				sides[regions[j][i].side].resource+=0.1;
			}
		}
	}
	for(i=0;i<buildings.length;i++){
		sides[buildings[i].region.side].maxpopulation+=buildings[i].manpower*buildings[i].health/bmaxhealth;
		if(time%50==0){
			sides[buildings[i].region.side].resource+=buildings[i].resource*buildings[i].health/bmaxhealth/10;
			sides[buildings[i].region.side].supply+=buildings[i].supply*buildings[i].health/bmaxhealth;
		}
	}
	var skip=2;
	for(i=0;i<sides.length;i++){
		if(time%skip!=0){
			break;
		}
		sides[i].manpower+=(sides[i].maxpopulation-sides[i].manpower)/80;
		var tosupplyred=[];
		var tosupplygreen=[];
		for(j=0;j<units[i].length;j++){
			if(units[i][j].side==0||(!units[i][j].supplied)){
				continue;
			}
			if(units[i][j].health<maxhealth){
				tosupplyred[tosupplyred.length]=units[i][j];
			}
			if(units[i][j].org<maxorg){
				tosupplygreen[tosupplygreen.length]=units[i][j];
			}
		}
		for(j=0;j<buildings.length;j++){
			if(buildings[j].side!=i&&(!buildings[j].supplied)){
				continue;
			}
			if(buildings[j].health<bmaxhealth){
				tosupplyred[tosupplyred.length]=buildings[j];
			}
			if(buildings[j].org<maxorg){
				tosupplygreen[tosupplygreen.length]=buildings[j];
			}
		}
		if(tosupplyred.length!=0){
			var totred=skip*Math.min(sides[i].supply,sides[i].manpower,tosupplyred.length*maxhealth/4);
			var perred=totred/tosupplyred.length;
			for(j=0;j<tosupplyred.length;j++){
				tosupplyred[j].health+=perred;
			}
			sides[i].manpower-=totred;
		}
		if(tosupplygreen.length!=0){
			var totgreen=skip*Math.min(sides[i].supply,sides[i].resource,tosupplygreen.length*maxhealth/4);
			var pergreen=totgreen/tosupplygreen.length;
			for(j=0;j<tosupplygreen.length;j++){
				tosupplygreen[j].org+=pergreen;
			}
			sides[i].resource-=totgreen;
		}
		
		if(sides[i].resource>=99999){
			sides[i].resource=99999;
		}
		if(sides[i].resource<0){
			sides[i].resource=0;
		}
		if(sides[i].manpower<0){
			sides[i].manpower=0;
		}
	}
}

function aiperform(ai){
	/*
	 to write:            											
	 1:	 ai units go to 
	 frontier (the central positions of controled region which 
	 borders the enemy's) a small circle with color indicate the owner of region 
	 note: the region has the shape of  __
	                                  /    \
	                                  \ __ /
	 	i.when they are not at frontier 
	 	or sometimes randomly when at frontier they go to another
	 	ii.they don't cross their enemy's place
	 	iii.not too slow
	 2: units go to the region being attacked to help defence
	 	(the regions being attacked are those who are the destination
	 	of enemy units )
	 	i.when region attacked and need reinforcement(it's up to you)
	 	ii.they don't cross enemy's border
	 	iii.not too slow
	 3: ai units retreat to another controled region
	 	i:when can't win (it's up to you,you can compare total health of attck and defence units )
	 	ii:reinforcement in (towrite 2) stops
	 	iii:not too slow
	 4: ai units attack bordered enemy's controled region
	 	(just change destination)
	 	i:when: randomly or you decide
	 	ii:not too slow
	 5:any other things you think ai should do
	 
	 vars and functions you may use
	 var pos[][] :positons
	 object position
	 var units[][] :units the first index is the side it belongs to ,0 index is neutral(ignore)
	 object unit
	 unit.changedes(x,y) :change its destination it will automatically goes to its destination
	 var regions[][] :regions
	 var sides[]:sides, 0 index is neutral
	 function isfriend(unit1,unit2)
	 */
}

function attack(a,b){//a attack b
	b.health-=0.1*a.org/maxorg;
	b.org-=0.05;
	if(b.org<0){
		b.org=0;
	}
	a.org-=0.1;
	if(a.org<0){
		a.org=0;
		a.rest=10;
		a.target=null;
		a.despos=a.pos;
	}
	var boom=new Image();
    boom.src="boom.png";
    var xoff=0;
    var yoff=0;
    if((b.x-a.x)*(b.x-a.x)+(b.y-a.y)*(b.y-a.y)!=0){
    	xoff=-5*(b.x-a.x)/Math.sqrt((b.x-a.x)*(b.x-a.x)+(b.y-a.y)*(b.y-a.y));
    	yoff=-5*(b.y-a.y)/Math.sqrt((b.x-a.x)*(b.x-a.x)+(b.y-a.y)*(b.y-a.y));
    }
	ctx.drawImage(boom, b.x-17+xoff, b.y-15+yoff);
	if(b.health<=0){
		b.die();
	}
}

function isfriend(a,b){
	return ftable[a.side][b.side];
}
















//Graphics
function convertCanvasToImage(canvas) {
	var image = new Image();
	image.src = canvas.toDataURL("image/png");
	return image;
}
function paintbg(){
	ctx.strokeStyle ='#000000';
	ctx.fillStyle = 'rgb(' + 100 + ',' + 255 + ',100)';
	ctx.fillRect(0,0,width,height);
	
		for(i=0;i<pos.length;i++){
		for(j=0;j<pos[i].length;j++){
			ctx.beginPath();
			ctx.strokeStyle = pos[i][j].color;
			ctx.rect(pos[i][j].x-rad,pos[i][j].y-rad,rad*2,rad*2);
			ctx.fillStyle = pos[i][j].color;
			ctx.stroke();
			ctx.fill("evenodd");
			}
		}
}
function paintmenu(){
	//ctx.strokeStyle =menucolor[playerside];
	ctx.lineWidth="4";
	ctx.beginPath();
	ctx.rect(mapwidth,2,width-mapwidth-2,height-4);
	ctx.fillStyle = menucolor[playerside];
	ctx.stroke();
	ctx.fill("evenodd");
	
    ctx.beginPath();
	ctx.rect(mapwidth,2,width-mapwidth-2,width-mapwidth-2);
	ctx.fillStyle = menucolor[playerside];
	ctx.stroke();
	ctx.fillStyle = 'rgb(' + 100 + ',' + 255 + ',100)';
	ctx.stroke();
	ctx.fill("evenodd");
	
	ctx.font = '18pt Calibri';
    ctx.fillStyle = 'black';
    ctx.fillText(Math.floor(sides[playerside].resource), mapwidth+20, 20+width-mapwidth);
    ctx.fillText(Math.floor(sides[playerside].supply), mapwidth+20, 40+width-mapwidth);
    ctx.fillText(Math.floor(sides[playerside].manpower), mapwidth+20, 60+width-mapwidth);

    ctx.fillText(sides[playerside].maxpopulation, mapwidth+20, 80+width-mapwidth);
    
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mapwidth, 85+width-mapwidth);
    ctx.lineTo(width, 85+width-mapwidth);
    ctx.stroke();
    
    if(mousemod==1){
    	var select=new Image();
    	select.src="select.png";
		ctx.drawImage(select,mapwidth+20, 87+width-mapwidth);
    }
    else{
    	var repair=new Image();
    	repair.src="repair.png";
		ctx.drawImage(repair,mapwidth+20, 87+width-mapwidth);
    }
    
	ctx.beginPath();
    ctx.moveTo(mapwidth, 115+width-mapwidth);
    ctx.lineTo(width, 115+width-mapwidth);
    ctx.stroke();
	
}
function paint(){
	ctx.fillStyle = 'rgb(' + 100 + ',' + 255 + ',100)';
	ctx.fillRect(0,0,width,height);
	ctx.drawImage(IMG, 0, 0);
	ctx.strokeStyle ='#000000';
	ctx.lineWidth="1";
	if(mousedown){
	ctx.beginPath();
	ctx.rect(dx,dy,cx-dx,cy-dy);
	ctx.stroke();
	}
	for(i=0;i<regions.length;i++){
		for(j=0;j<regions[i].length;j++){
			ctx.beginPath();
			ctx.arc(regions[i][j].ceni*2*rad+rad,regions[i][j].cenj*2*rad+rad,rad/2,0,2*Math.PI);
			ctx.stroke();
			ctx.fillStyle = color[regions[i][j].side];//'rgb(' + 0 + ',' + 0 + ',0)';
			ctx.fill("evenodd");
		}
 	}
 	for(i=1;i<units.length;i++){
 		for(j=0;j<units[i].length;j++){
 			if(units[i][j].side==0){
 	 			continue;
 	 		}
 			paintunit(units[i][j]);
 		}
 	}
 	for(i=0;i<buildings.length;i++){
 		paintbuilding(buildings[i]);
 	}
 	for(i=0;i<sel.length;i++){
 		var u=sel[i];
 		if(u.side==0){
 			continue;
 		}
 		paintinten(u);
		ctx.lineWidth="2";
		ctx.beginPath();
		ctx.arc(u.x,u.y,rad,0,2*Math.PI);
		ctx.stroke();
		paintbar(u);
 	}
 	ctx.lineWidth="4";
 	for(i=0;i<buildings.length;i++){
 		var b=buildings[i];
 		ctx.beginPath();
 		if(b.pos.units.length!=0){
 			ctx.strokeStyle = color[b.pos.units[0].side];
 			ctx.rect(b.pos.x-rad,b.pos.y-rad+2*rad-rad*2*b.health/bmaxhealth,rad*2,rad*2*b.health/bmaxhealth);
 	 		ctx.stroke();
 		}
 	}
 	paintflags();
 	paintmenu();
 	writeMessage(c, ""+buildings.length);
 	update();
}

function paintunit(u){
	var c=color[u.side];
	ctx.lineWidth="2";
	/*if(u.sel){
		paintinten(u);
		ctx.lineWidth="4";
	}*/
	ctx.beginPath();
	ctx.arc(u.x,u.y,rad,0,2*Math.PI);
	ctx.stroke();
	ctx.fillStyle = c;//'rgb(' + 220 + ',' + 220 + ',220)';
	ctx.fill("evenodd");
	/*if(u.sel){
		paintbar(u);
	}*/
	if(!u.supplied){
		ctx.beginPath();
		ctx.moveTo(u.x-rad/2, u.y-rad/2);
		ctx.lineTo(u.x+rad/2, u.y+rad/2);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(u.x+rad/2, u.y-rad/2);
		ctx.lineTo(u.x-rad/2, u.y+rad/2);
		ctx.stroke();
	}
}

function paintbar(u){
	ctx.beginPath();
	ctx.lineWidth="1";
	ctx.rect(u.x-3*rad/2,u.y+rad,barlen,barwid);
	ctx.stroke();
	ctx.fillStyle = 'rgb(' + 255 + ',' + 255 + ',255)';
	ctx.fill("evenodd");
	ctx.beginPath();
	ctx.lineWidth="1";
	ctx.rect(u.x-3*rad/2,u.y+rad,barlen*u.health/maxhealth,barwid);
	ctx.stroke();
	ctx.fillStyle = 'rgb(' + 230 + ',' + 50 + ',50)';
	ctx.fill("evenodd");
	
	ctx.beginPath();
	ctx.lineWidth="1";
	ctx.rect(u.x-3*rad/2,u.y+rad+barwid,barlen,barwid);
	ctx.stroke();
	ctx.fillStyle = 'rgb(' + 255 + ',' + 255 + ',255)';
	ctx.fill("evenodd");
	ctx.beginPath();
	ctx.lineWidth="1";
	ctx.rect(u.x-3*rad/2,u.y+rad+barwid,barlen*u.org/maxorg,barwid);
	ctx.stroke();
	ctx.fillStyle = 'rgb(' + 100 + ',' + 100 + ',250)';
	ctx.fill("evenodd");
}


function paintinten(u){
	 ctx.beginPath();
     ctx.moveTo(u.x, u.y);
     ctx.lineTo(u.despos.x, u.despos.y);
     ctx.lineWidth = 1;
     ctx.strokeStyle = '#0000ff';
     ctx.stroke();
     if(u.target!=null&&u.target.side!=0){
    	 ctx.beginPath();
         ctx.moveTo(u.x, u.y);
         ctx.lineTo(u.target.x, u.target.y);
         ctx.lineWidth = 1;
         ctx.strokeStyle = '#ff0000';
         ctx.stroke();
     }
     ctx.strokeStyle = '#000000';
}

function paintflags(){
	ctx.lineWidth="1";
	ctx.strokeStyle = '#000000';
	for(i=0;i<regions.length;i++){
		for(j=0;j<regions[i].length;j++){
			if(!regions[i][j].isbase||regions[i][j].side==0){
				continue;
			}
			ctx.beginPath();
		    ctx.moveTo(regions[i][j].ceni*2*rad+rad,regions[i][j].cenj*2*rad+rad);
		    ctx.lineTo(regions[i][j].ceni*2*rad+rad,regions[i][j].cenj*2*rad-30+rad);
		    ctx.lineTo(regions[i][j].ceni*2*rad+10+rad,regions[i][j].cenj*2*rad-25+rad);
		    ctx.lineTo(regions[i][j].ceni*2*rad+rad,regions[i][j].cenj*2*rad-20+rad);
		    ctx.stroke();
			ctx.fillStyle = color[regions[i][j].side];//'rgb(' + 0 + ',' + 0 + ',0)';
			ctx.fill("evenodd");
		}
 	}
}

function paintbuilding(b){
	ctx.lineWidth="4";
	/*if(u.sel){
		paintinten(u);
		ctx.lineWidth="4";
	}*/
	ctx.beginPath();
	if(b.pos.units.length!=0){
		ctx.strokeStyle = color[b.pos.units[0].side];
	}
	else{
		ctx.strokeStyle = 'rgb(' + 0 + ',' + 0 + ',0)';
	}
	ctx.rect(b.pos.x-rad,b.pos.y-rad+2*rad-rad*2*b.health/bmaxhealth,rad*2,rad*2*b.health/bmaxhealth);
	switch(b.type){
	case 0:ctx.fillStyle = 'rgb(' + 220 + ',' + 220 + ',220)';break;
	case 1:ctx.fillStyle = 'rgb(' + 120 + ',' + 120 + ',120)';break;
	case 2:ctx.fillStyle = 'rgb(' + 120 + ',' + 120 + ',20)';break;
	default:break;
	}
	ctx.stroke();
	ctx.fill("evenodd");
	/*
	ctx.beginPath();
	ctx.arc(b.pos.x,b.pos.y,rad,0,2*Math.PI);
	ctx.stroke();
	ctx.fillStyle = 'rgb(' + 220 + ',' + 220 + ',220)';
	ctx.fill("evenodd");
	*/
	if(!b.supplied){
		ctx.beginPath();
		ctx.moveTo(b.x-rad/2, b.y-rad/2);
		ctx.lineTo(b.x+rad/2, b.y+rad/2);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(b.x+rad/2, b.y-rad/2);
		ctx.lineTo(b.x-rad/2, b.y+rad/2);
		ctx.stroke();
	}
}


//UI
function doKeyDown(evt){
	switch (evt.keyCode) {
	/*case 38:atom[0].d = 0;break;//up
	case 40:atom[0].d = Math.PI;break;//down
	case 37:atom[0].d =-Math.PI/2;break;//left
	case 39:atom[0].d =Math.PI/2;break; //right*/
	case 13:speed=1-speed;break;//space
	}
}
window.onkeydown = doKeyDown;

function writeMessage(c, message) {
    ctx.font = '18pt Calibri';
    ctx.fillStyle = 'black';
    ctx.fillText(message, 10, 25);
  }
  function getMousePos(c, evt) {
    var rect = c.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }
  
  c.addEventListener('mousemove', function(evt) {
    var mousePos = getMousePos(c, evt);
    //var message = units[0];
    cx=mousePos.x;
    cy=mousePos.y;
    //writeMessage(c, message);
  }, false);


  c.addEventListener("mousedown", getPosition, false);

  function getPosition(event)
  {
	  mousedown=true;
	  dx=event.x-c.offsetLeft;
	  dy=event.y-c.offsetTop;
    /*var x = event.x;
    var y = event.y;

    x -= c.offsetLeft;
    y -= c.offsetTop;

    alert("x:" + x + " y:" + y);*/
  }
  
  c.addEventListener("mouseup", getPosition2, false);

  function getPosition2(event)
  {
    var x = event.x;
    var y = event.y;

    x -= c.offsetLeft;
    y -= c.offsetTop;
    mousedown=false;
    var max,mix,may,miy;
    if(x>dx){
    	max=x;mix=dx;
    }
    else{
    	max=dx;mix=x;
    }
    if(y>dy){
    	may=y;miy=dy;
    }
    else{
    	may=dy;miy=y;
    }
    if(x>=mapwidth&&y>=85+width-mapwidth&&y<=115+width-mapwidth){
    	mousemod=1-mousemod;
    }
    else if(mousemod==0){
    	if(max-mix<10&&may-miy<10){
    		if(pos[Math.round((x-rad)/(2*rad))][Math.round((y-rad)/(2*rad))].units.length!=0){
    			var tar=pos[Math.round((x-rad)/(2*rad))][Math.round((y-rad)/(2*rad))].units[0];
    			var isenemy=false;
    			for(i=0;i<sel.length;i++){
    				if(sel[i].pcontrol){
    					if(isfriend(sel[i],tar)==false){
    						isenemy=true;
    						sel[i].target=tar;
    						sel[i].changedes(x,y);
    					}
    				}
    			}
    			if(!isenemy){
    				for(i=0;i<sel.length;i++){
    					sel[i].sel=false;
    				}
    				sel=[];
    				sel[0]=tar;
    				tar.sel=true;
    				playerside=tar.side;
    			}
    		}
    		else{
    			for(i=0;i<sel.length;i++){
    				if(sel[i].pcontrol){
    					sel[i].target=null;
    					sel[i].changedes(x,y);
    				}
    			}
    		}
    	}
    	else{
    		sel=[];
    		for(i=0;i<units.length;i++){
    			for(j=0;j<units[i].length;j++){
    				units[i][j].sel=false;
    				if(units[i][j].x<=max&&units[i][j].x>=mix&&units[i][j].y<=may&&units[i][j].y>=miy){
    					units[i][j].sel=true;
    					sel[sel.length]=units[i][j];
    				}
    				else{
    					//units[0][i].sel=false;
    				}
    			}
    		}
    	}
    }
    else if(mousemod==1){
    	if(max-mix<10&&may-miy<10){
    		if(pos[Math.round((x-rad)/(2*rad))][Math.round((y-rad)/(2*rad))].building!=null){
    			var bui=pos[Math.round((x-rad)/(2*rad))][Math.round((y-rad)/(2*rad))].building;
    			if(bui.side()-playerside==0){
    				bui.supplied=!bui.supplied;
    			}	
    		}
    		else if(pos[Math.round((x-rad)/(2*rad))][Math.round((y-rad)/(2*rad))].units.length!=0){
    			var tar=pos[Math.round((x-rad)/(2*rad))][Math.round((y-rad)/(2*rad))].units[0];
    			if(tar.side==playerside){
    				tar.supplied=!tar.supplied;
    			}
    		}
    	}
    	else{
    		for(j=0;j<units[playerside].length;j++){
    			if(units[playerside][j].x<=max&&units[playerside][j].x>=mix&&units[playerside][j].y<=may
    					&&units[playerside][j].y>=miy){
    				units[playerside][j].supplied=!units[playerside][j].supplied;
				}
    		}
    	}
    }
     //alert("dx:"+dx+"dy"+dy+"x:" + x + " y:" + y);
  }



//AI






  
