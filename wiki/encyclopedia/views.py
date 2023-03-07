from django.shortcuts import render, redirect

from . import util


def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
    })

def entry(request, title):
    content = util.get_entry(title)
        
    if content is None:
        return render(request, "encyclopedia/error.html", {
            "title": title
        })
                           
    else:
        return render(request, "encyclopedia/entry.html", {
            "title": title,
            "content": content
        })

def search(request):
    search_query = request.GET.get('q')
    if search_query is None:
        return render(request, "encyclopedia/index.html")
    else:
        content = util.get_entry(search_query) #use get_entry to search for entry
        if content is None:
             all_entries = util.list_entries()
             matching_entries = list(filter(lambda x: search_query in x, all_entries))
             return render(request, "encyclopedia/search.html", {"matching_entries": matching_entries})
             #return render(request, "encyclopedia/index.html") # remove this code, search results to be finished here
        else:
            return redirect('entry', title=search_query)
