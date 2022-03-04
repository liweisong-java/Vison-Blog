package com.weisong.backend.service.impl;

import com.weisong.backend.entities.Article;
import com.weisong.backend.entities.User;
import com.weisong.backend.mapper.ArticleMapper;
import com.weisong.backend.service.ArticleService;
import com.weisong.backend.service.UserService;
import com.weisong.backend.util.BaseUserInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-26-11:41
 */
@Service
public class ArticleServiceImpl implements ArticleService {

    @Autowired
    ArticleMapper articleMapper;

    @Override
    public List<Article> getAllArticle() {
        return articleMapper.getAllArticle();
    }

    @Override
    public List<Article> addArticle(Article article) {
        BaseUserInfo.get("user_uuid");

        return articleMapper.addArticle(article.createArticleUuid(),article.getTitle(), article.getArticle(),
                article.getRead(),
                article.getLike(),
                article.getAnswer(),
                article.getCreateDate(),
                article.getUpdateDate(),
                article.getUser_uuid(),
                article.getName(),
                article.getCategoryId());
    }

    @Override
    public void deleteArticleById(String article_uuid) {
        articleMapper.deleteArticleById(article_uuid);
    }


}
