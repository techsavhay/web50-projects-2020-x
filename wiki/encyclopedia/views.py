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
        new_page_title = request.POST.get('new_page_title')
        existing_page_title = util.get_entry(new_page_title)[2:]
        print(f"New page title = {new_page_title} Existing page title = {existing_page_title}" )
        # if the new page title is the same as an existing one then show page_error.html
        if existing_page_title is not None and new_page_title == existing_page_title:
            return render(request, "encyclopedia/page_error.html", {
            "new_page_title": new_page_title,
            })
        #if the page title is new then save the title and contents in a new .md file.
        else:
            new_page_content = request.POST.get('new_page_content')
            file_path = os.path.join('entries/', f'{new_page_title}.md')
            # define the complete new file with title and contents
            complete_new_file = f'# {new_page_title}\n\n{new_page_content}'
            # write the contents to the file
            with open(file_path, 'w') as f:
                f.write(complete_new_file)
            return redirect('entry', title=new_page_title)
    #if method is not POST
    else:
        return render(request, "encyclopedia/new_page.html")