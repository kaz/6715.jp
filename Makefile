.PHONY: serve
serve: submodule
	docker run --rm -v $(PWD):/src -p 1313:1313 klakegg/hugo serve

.PHONY: public
public: submodule
	docker run --rm -v $(PWD):/src -v $(PWD)/public:/target klakegg/hugo

.PHONY: submodule
submodule:
	git submodule update --init

.PHONY: deploy
deploy: public
	git -C $< init
	echo "narusejun.com" > $</CNAME
	git -C $< config user.name $$(git log -n1 --pretty=format:%an)
	git -C $< config user.email $$(git log -n1 --pretty=format:%ae)
	git -C $< add -A
	git -C $< commit -m "automated deployment"
	git -C $< push --force https://$${GITHUB_ACTOR}:$${GITHUB_TOKEN}@github.com/$${GITHUB_REPOSITORY}.git HEAD:gh-pages

.PHONY: clean
clean:
	rm -rf $$(cat .gitignore)
