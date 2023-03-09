from django.shortcuts import render, redirect
from django.urls import reverse
import random
import os
import markdown2

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
        edit_url = reverse('edit_page', kwargs={'title': title})
        html_content = markdown2.markdown(content)
        return render(request, "encyclopedia/entry.html", {
            "title": title,
            "content": html_content,
            "edit_url": edit_url
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

def edit_page(request, title):
    content = util.get_entry(title)
        
    if content is None:
        return render(request, "encyclopedia/error.html", {
            "title": title
        })
                           
    else:
        return render(request, "encyclopedia/edit_page.html", {
            "title": title,
            "content": content
        })

def save_edit(request, title):
    if request.method == 'POST':
        # Get the edited content and title from the request
        edited_title = request.POST.get('edited_title')
        edited_content = request.POST.get('edited_content')

        # Save the updated content to the file
        util.save_entry(edited_title, edited_content)

        # Redirect the user back to the updated entry page
        return redirect('entry', title=edited_title)
    else:
        # Handle GET request if necessary
        return render(request, "encyclopedia/index.html")

#function which generates view for random page link
def random_page(request):
    #pick a random entry from list_entries list
    random_entry= random.choice(util.list_entries())
    #update the content from the random title (random_entry)
    content = util.get_entry(random_entry)
    #return the entry page and pass on the title and contents variables.
    return render(request, "encyclopedia/entry.html", {
            "title": random_entry,
            "content": content
        })