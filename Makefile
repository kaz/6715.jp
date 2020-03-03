build:
	git submodule update --init
	docker run --rm -v $(PWD):/src -v $(PWD)/public:/target klakegg/hugo

clean:
	rm -rf $$(cat .gitignore)
