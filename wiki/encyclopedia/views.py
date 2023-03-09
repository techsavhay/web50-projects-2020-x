from django.shortcuts import render, redirect
import os

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
            return render(request, "encyclopedia/search.html", {"matching_entries": matching_entries, "query": search_query})
        
        else:
            return redirect('entry', title=search_query)

def new_page(request):
    if request.method == 'POST':
        new_page_title = (request.POST.get('new_page_title').strip())
        #check if the page exists using entry_exists function, if it returns true then show page_error.html
        if (util.entry_exists(new_page_title)):
            return render(request, "encyclopedia/page_error.html", {
            "new_page_title": new_page_title,
            })
        else:
            #grab the content from the user input
            new_page_content = request.POST.get('new_page_content')
            #specifing the new filename format and location
            file_path = os.path.join('entries/', f'{new_page_title}.md')
            # define the complete new file with title and contents (and newlines)
            complete_new_file = f'# {new_page_title}\n\n{new_page_content}'
            # write the contents to the file
            with open(file_path, 'w') as f:
                f.write(complete_new_file)
            return redirect('entry', title=new_page_title)
    #if method is not POST
    else:
        return render(request, "encyclopedia/new_page.html")