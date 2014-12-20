LL.bindClass("android.app.Activity");
LL.bindClass("android.app.AlertDialog");
LL.bindClass("android.content.DialogInterface");
LL.bindClass("android.widget.ListView");
LL.bindClass("android.widget.SimpleAdapter");
LL.bindClass("java.util.HashMap");
LL.bindClass("java.util.ArrayList");
LL.bindClass("android.R");

var x;
var cItems;
if(typeof resultCode=="undefined")
{
var i=new Intent();
i.setClassName("net.pierrox.lightning_launcher.llscript.thirdpartyapitest","net.pierrox.lightning_launcher.llscript.thirdpartyapitest.Parser");
var d=LL.getContainerById(99);
var dItems=d.getItems();
var packages=[];
for(var i1=0;i1<dItems.length;i1++)
{
add(dItems.getAt(i1));
}
LL.writeToLogFile(packages,false);
i.putExtra("apps",packages.toString());
LL.startActivityForResult(i,LL.getCurrentScript(),1);
}

else
{
if(resultCode==Activity.RESULT_OK)
{
var categories=data.getExtra("result");
var packages=data.getExtra("apps");
var c=LL.getCurrentDesktop();
var d=LL.getContainerById(99);
var dItems=d.getItems();
var allCategories=[];
for(var i=0;i<categories.length;i++)
{
if(categories[i]==null)categories[i]="Other";
if(allCategories.indexOf(categories[i])==-1)allCategories.push(categories[i]);
}
allCategories.sort(noCaseSort);

var list=new ArrayList();
for(var i=0;i<allCategories.length;i++)
{
var map=new HashMap();
map.put("root",allCategories[i]);
list.add(map);
}
var listView=new ListView(LL.getContext());
var adapter=new SimpleAdapter(LL.getContext(),list,R.layout.simple_list_item_multiple_choice,["root"],[R.id.text1]);
listView.setAdapter(adapter);
listView.setChoiceMode(ListView.CHOICE_MODE_MULTIPLE);
var builder=new AlertDialog.Builder(LL.getContext());
builder.setView(listView);
builder.setTitle("Categories");
builder.setNegativeButton("Cancel",new DialogInterface.OnClickListener(){onClick:function(dialog,id){dialog.cancel();}});
builder.setPositiveButton("Commit",new DialogInterface.OnClickListener(){onClick:function(dialog,id){
cItems=c.getItems();
for(var i=0;i<cItems.length;i++)
{
c.removeItem(cItems.getAt(i));
}
LL.save();
for(var i=0;i<dItems.length;i++)
{
sort(dItems.getAt(i));
}

arrangeAlphabetical(c,c.getWidth());
cItems=c.getItems();
x=0;
//doArrangement();
Android.makeNewToast("Done.",true).show();
dialog.dismiss();
}});
builder.setNeutralButton("Group",new DialogInterface.OnClickListener(){onClick:function(dialog,id){
dialog.dismiss();
setTimeout(function(){
var selection=listView.getCheckedItemPositions();
var sel=[];
for(var i=0;i<allCategories.length;i++)
{
if(selection.get(i))sel.push(i);
}
var newCategory=prompt("How should this Group of Categories be called?",allCategories[sel[0]]);
for(var i=0;i<categories.length;i++)
{
if(sel.indexOf(allCategories.indexOf(categories[i]))!=-1)categories[i]=newCategory;
}
var newAllCategories=[newCategory];
for(var i=0;i<allCategories.length;i++)
{
if(sel.indexOf(i)==-1)newAllCategories.push(allCategories[i]);
}
allCategories=newAllCategories;
allCategories.sort(noCaseSort);
list=new ArrayList();
for(var i=0;i<allCategories.length;i++)
{
var map=new HashMap();
map.put("root",allCategories[i]);
list.add(map);
}
adapter=new SimpleAdapter(LL.getContext(),list,R.layout.simple_list_item_multiple_choice,["root"],[R.id.text1]);
listView.setAdapter(adapter);
mainDialog.show();
},0);
}
});
var mainDialog=builder.create();
mainDialog.show();
}
else
{
var error;
try{
error=data.getExtra("error");
}
catch(Exception)
{
error="unknown error";
}
Android.makeNewToast("Request Canceled\nError: "+error,false).show();
}
}

function add(item)
{
if(item.getType()=="Shortcut"){
packages.push(item.getIntent().getComponent().getPackageName());
}
else
{
fItems=item.getContainer().getItems();
for(var i2=0;i2<fItems.length;i2++)
{
add(fItems.getAt(i2));
}
}
}

function sort(item)
{
if(item.getType()=="Shortcut"){
var index=packages.indexOf(item.getIntent().getComponent().getPackageName());
var f=c.getItemByName(categories[index]);
if(f==null)
{
f=c.addFolder(categories[index],0,0);
f.setName(categories[index]);
}
var newItem=f.getContainer().addShortcut(item.getLabel(),item.getIntent(),0,0);
newItem.setDefaultIcon(item.getDefaultIcon());
}
else
{
fItems=item.getContainer().getItems();
for(var i2=0;i2<fItems.length;i2++)
{
sort(fItems.getAt(i2));
}
}
}

function noCaseSort(a,b)
{
    if(a.toLowerCase()>b.toLowerCase())return 1;
    if(a.toLowerCase()<b.toLowerCase())return -1;
    return 0;
}

function arrangeAlphabetical(c,width)//c=container
{
		var items=c.getItems();
		var labels=[];
		var cells=Math.floor(width/c.getCellWidth());
		for(a=0;a<items.length;a++)
	{
		var i=items.getAt(a);
		labels.push(i.getLabel());
		i.setName(i.getLabel());
	}
		labels.sort(noCaseSort);
		for(b=0;b<labels.length;b++)
		{
		c.getItemByName(labels[b]).setCell(b%cells,Math.floor(b/cells),b%cells+1,Math.floor(b/cells)+1);
		LL.writeToLogFile("Set: "+labels[b]+" to "+b%cells+", "+Math.floor(b/cells)+"\n",true);
		LL.save();
		}
}

function doArrangement()
{
var item=cItems.getAt(x);
item.open();
setTimeout(function(){
arrangeAlphabetical(item.getContainer());
setTimeout(function(){
item.close();
x++;
if(x<cItems.length)doArrangement();
},10);
},10);
}